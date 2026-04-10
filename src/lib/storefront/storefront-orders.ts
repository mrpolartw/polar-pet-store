import {
  createOrderWorkflow,
  updateOrderWorkflow,
} from "@medusajs/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type { GraphResultSet } from "@medusajs/types"
import { applyMembershipPointRedemption } from "../membership/membership-point-effects"
import {
  buildMembershipOrderAccountingMetadata,
  getMembershipOrderPromoDiscount,
  getMembershipOrderRedemptionAmount,
  getMembershipOrderRedeemedPoints,
  getMembershipOrderShippingFee,
  getMembershipOrderSubtotal,
  normalizeLookupPhone,
} from "../membership/membership-order-accounting"
import { processOrderCompletionMembershipEffects } from "../membership/order-membership-effects"
import { validateMembershipPointRedemption } from "../membership/store-point-redemption"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import type MembershipModuleService from "../../modules/membership/service"

type QueryGraphService = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: {
      skip?: number
      take?: number
      order?: Record<string, "ASC" | "DESC">
    }
  }) => Promise<{ data: unknown[] }>
}

type OrderItemRecord = {
  id?: string | null
  title?: string | null
  subtitle?: string | null
  thumbnail?: string | null
  product_id?: string | null
  variant_id?: string | null
  variant_title?: string | null
  unit_price?: number | string | null
  quantity?: number | string | null
  metadata?: Record<string, unknown> | null
}

type OrderAddressRecord = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
}

type StorefrontOrderRecord = GraphResultSet<"order">["data"][number] & {
  id: string
  customer_id?: string | null
  status?: string | null
  currency_code?: string | null
  email?: string | null
  total?: number | string | null
  subtotal?: number | string | null
  shipping_total?: number | string | null
  discount_total?: number | string | null
  created_at?: string | Date | null
  metadata?: Record<string, unknown> | null
  items?: OrderItemRecord[] | null
  shipping_address?: OrderAddressRecord | null
  billing_address?: OrderAddressRecord | null
}

type StoreCreateOrderItemInput = {
  id?: string | null
  productId?: string | number | null
  variantId?: string | null
  name: string
  image?: string | null
  specs?: string | null
  price: number
  quantity: number
}

export interface StoreCreateOrderInput {
  customerId?: string | null
  shippingMethod: string
  paymentMethod: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  recipientName: string
  recipientPhone: string
  promoCode?: string | null
  deliveryNote?: string | null
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  items: StoreCreateOrderItemInput[]
  pointRedemption?: {
    requestedPoints: number
    redeemedPoints: number
    redemptionAmount: number
    referenceId?: string | null
    orderSubtotal: number
  } | null
}

export interface StorefrontOrderResponseItem {
  id: string
  productId: string | null
  variantId: string | null
  name: string
  specs: string
  quantity: number
  price: number
  image: string
}

export interface StorefrontOrderResponse {
  id: string
  rawId: string
  status: string
  createdAt: string | null
  email: string | null
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  promoCode: string | null
  shippingMethod: string
  paymentMethod: string
  phone: string
  recipient: {
    name: string
    phone: string
  }
  pointRedemption: {
    redeemedPoints: number
    redemptionAmount: number
    referenceId: string | null
  }
  pointRedemptionAmount: number
  items: StorefrontOrderResponseItem[]
}

const STOREFRONT_ORDER_FIELDS = [
  "id",
  "customer_id",
  "status",
  "currency_code",
  "email",
  "total",
  "subtotal",
  "shipping_total",
  "discount_total",
  "created_at",
  "metadata",
  "*items",
  "*shipping_address",
  "*billing_address",
] as const

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getQueryGraphService(scope: MedusaContainer): QueryGraphService {
  return scope.resolve<QueryGraphService>(ContainerRegistrationKeys.QUERY)
}

function toFiniteInteger(value: number | string | null | undefined): number {
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  if (!Number.isFinite(normalized)) {
    return 0
  }

  return Math.max(0, Math.round(normalized))
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length ? trimmed : null
}

function buildPersonName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim()
}

function mapOrderStatus(status: string | null | undefined): string {
  switch (status) {
    case "canceled":
      return "cancelled"
    case "completed":
    case "pending":
    default:
      return "processing"
  }
}

function expandUnitRows(items: StoreCreateOrderItemInput[]) {
  return items.flatMap((item, itemIndex) =>
    Array.from({ length: item.quantity }).map((_, unitIndex) => ({
      sourceItemId: item.id ?? `${item.productId ?? item.name}-${itemIndex}`,
      sourceItem: item,
      rowKey: `${item.id ?? item.productId ?? item.name}-${itemIndex}-${unitIndex}`,
      grossUnitPrice: toFiniteInteger(item.price),
    }))
  )
}

function allocateUnitNetPrices(input: {
  items: StoreCreateOrderItemInput[]
  promoDiscount: number
  redemptionAmount: number
}) {
  const unitRows = expandUnitRows(input.items)
  const grossSubtotal = unitRows.reduce(
    (sum, row) => sum + row.grossUnitPrice,
    0
  )
  const totalReduction = Math.min(
    grossSubtotal,
    Math.max(0, input.promoDiscount + input.redemptionAmount)
  )

  if (!unitRows.length) {
    return []
  }

  let remainingReduction = totalReduction

  unitRows.forEach((row, index) => {
    if (remainingReduction <= 0) {
      row.grossUnitPrice = Math.max(0, row.grossUnitPrice)
      return
    }

    const provisionalReduction =
      index === unitRows.length - 1 || grossSubtotal === 0
        ? remainingReduction
        : Math.floor((totalReduction * row.grossUnitPrice) / grossSubtotal)
    const appliedReduction = Math.min(
      row.grossUnitPrice,
      provisionalReduction,
      remainingReduction
    )

    row.grossUnitPrice -= appliedReduction
    remainingReduction -= appliedReduction
  })

  if (remainingReduction > 0) {
    for (const row of unitRows) {
      if (remainingReduction <= 0) {
        break
      }

      const extraReduction = Math.min(row.grossUnitPrice, remainingReduction)
      row.grossUnitPrice -= extraReduction
      remainingReduction -= extraReduction
    }
  }

  return unitRows
}

function buildOrderLineItems(input: {
  items: StoreCreateOrderItemInput[]
  promoDiscount: number
  redemptionAmount: number
}) {
  return allocateUnitNetPrices(input).map((row) => ({
    title: row.sourceItem.name,
    subtitle: row.sourceItem.specs ?? undefined,
    thumbnail: row.sourceItem.image ?? undefined,
    quantity: 1,
    product_id:
      row.sourceItem.productId !== undefined && row.sourceItem.productId !== null
        ? String(row.sourceItem.productId)
        : undefined,
    variant_id: row.sourceItem.variantId ?? undefined,
    variant_title: row.sourceItem.specs ?? undefined,
    unit_price: row.grossUnitPrice,
    requires_shipping: true,
    is_discountable: false,
    metadata: {
      source_item_id: row.sourceItemId,
      source_row_key: row.rowKey,
      original_unit_price: toFiniteInteger(row.sourceItem.price),
    },
  }))
}

function groupOrderItems(items: OrderItemRecord[] | null | undefined): StorefrontOrderResponseItem[] {
  return (items ?? []).map((item, index) => {
    const metadata =
      item.metadata && typeof item.metadata === "object" ? item.metadata : {}

    return {
      id:
        toNullableString(metadata["source_row_key"]) ??
        toNullableString(item.id) ??
        `item-${index + 1}`,
      productId: toNullableString(item.product_id),
      variantId: toNullableString(item.variant_id),
      name: item.title ?? "商品",
      specs: item.subtitle ?? item.variant_title ?? "",
      quantity: toFiniteInteger(item.quantity) || 1,
      price: toFiniteInteger(item.unit_price),
      image: item.thumbnail ?? "",
    }
  })
}

function mapStorefrontOrder(order: StorefrontOrderRecord): StorefrontOrderResponse {
  const metadata =
    order.metadata && typeof order.metadata === "object" ? order.metadata : {}
  const shippingAddress = order.shipping_address ?? null
  const recipientName =
    toNullableString(metadata["membership_recipient_name"]) ??
    buildPersonName(shippingAddress?.first_name, shippingAddress?.last_name)
  const recipientPhone =
    normalizeLookupPhone(
      toNullableString(metadata["membership_recipient_phone"]) ??
        shippingAddress?.phone ??
        metadata["membership_lookup_phone"]
    ) ?? ""

  return {
    id: order.id,
    rawId: order.id,
    status: mapOrderStatus(order.status),
    createdAt:
      order.created_at instanceof Date
        ? order.created_at.toISOString()
        : order.created_at ?? null,
    email: order.email ?? toNullableString(metadata["membership_buyer_email"]),
    subtotal: getMembershipOrderSubtotal(order),
    shippingFee: getMembershipOrderShippingFee(order),
    discount: getMembershipOrderPromoDiscount(order),
    total: toFiniteInteger(order.total),
    promoCode: toNullableString(metadata["membership_promo_code"]),
    shippingMethod:
      toNullableString(metadata["membership_shipping_method"]) ?? "home",
    paymentMethod:
      toNullableString(metadata["membership_payment_method"]) ?? "credit",
    phone: recipientPhone,
    recipient: {
      name: recipientName ?? "收件人",
      phone: recipientPhone,
    },
    pointRedemption: {
      redeemedPoints: getMembershipOrderRedeemedPoints(order),
      redemptionAmount: getMembershipOrderRedemptionAmount(order),
      referenceId: toNullableString(metadata["membership_redemption_reference"]),
    },
    pointRedemptionAmount: getMembershipOrderRedemptionAmount(order),
    items: groupOrderItems(order.items),
  }
}

async function retrieveStorefrontOrderRecord(
  scope: MedusaContainer,
  orderId: string
): Promise<StorefrontOrderRecord | null> {
  const query = getQueryGraphService(scope)
  const { data } = await query.graph({
    entity: "order",
    fields: [...STOREFRONT_ORDER_FIELDS],
    filters: {
      id: orderId,
    },
  })

  return (data[0] as StorefrontOrderRecord | undefined) ?? null
}

export async function retrieveStorefrontOrder(
  scope: MedusaContainer,
  orderId: string
): Promise<StorefrontOrderResponse | null> {
  const order = await retrieveStorefrontOrderRecord(scope, orderId)

  return order ? mapStorefrontOrder(order) : null
}

export async function listStorefrontOrdersForCustomer(
  scope: MedusaContainer,
  customerId: string
): Promise<StorefrontOrderResponse[]> {
  const query = getQueryGraphService(scope)
  const { data } = await query.graph({
    entity: "order",
    fields: [...STOREFRONT_ORDER_FIELDS],
    filters: {
      customer_id: customerId,
    },
    pagination: {
      take: 50,
      order: {
        created_at: "DESC",
      },
    },
  })

  return (data as StorefrontOrderRecord[]).map(mapStorefrontOrder)
}

export async function listStorefrontOrdersByPhone(
  scope: MedusaContainer,
  phone: string,
  limit = 20
): Promise<StorefrontOrderResponse[]> {
  const normalizedPhone = normalizeLookupPhone(phone)

  if (!normalizedPhone) {
    return []
  }

  const query = getQueryGraphService(scope)
  const { data } = await query.graph({
    entity: "order",
    fields: [...STOREFRONT_ORDER_FIELDS],
    pagination: {
      take: 100,
      order: {
        created_at: "DESC",
      },
    },
  })

  return (data as StorefrontOrderRecord[])
    .filter((order) => {
      const metadata =
        order.metadata && typeof order.metadata === "object" ? order.metadata : {}
      const lookupPhone =
        normalizeLookupPhone(metadata["membership_lookup_phone"]) ??
        normalizeLookupPhone(order.shipping_address?.phone)

      return lookupPhone === normalizedPhone
    })
    .slice(0, limit)
    .map(mapStorefrontOrder)
}

export async function createStorefrontOrder(
  scope: MedusaContainer,
  input: StoreCreateOrderInput
): Promise<StorefrontOrderResponse> {
  if (!input.items.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order items are required"
    )
  }

  const canonicalSubtotal = input.items.reduce(
    (sum, item) => sum + toFiniteInteger(item.price) * toFiniteInteger(item.quantity),
    0
  )
  const shippingFee = toFiniteInteger(input.shippingFee)
  const promoDiscount = Math.min(
    canonicalSubtotal,
    toFiniteInteger(input.discount)
  )
  const requestedRedemption = toFiniteInteger(
    input.pointRedemption?.redeemedPoints ??
      input.pointRedemption?.redemptionAmount ??
      0
  )

  if (requestedRedemption > 0 && !input.customerId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "使用點數折抵前請先登入會員帳號"
    )
  }

  let validatedRedemption = null as null | ReturnType<
    typeof validateMembershipPointRedemption
  >

  if (requestedRedemption > 0 && input.customerId) {
    const membershipService = getMembershipService(scope)
    const pointState = await membershipService.getCustomerPoints(input.customerId)
    const validation = validateMembershipPointRedemption({
      availablePoints: pointState.summary.available_points,
      requestedPoints: requestedRedemption,
      orderSubtotal:
        toFiniteInteger(input.pointRedemption?.orderSubtotal) || canonicalSubtotal,
    })

    if (!validation.is_valid || validation.redeemable_points <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        validation.validation_message ?? "點數折抵資料無效"
      )
    }

    validatedRedemption = validation
  }

  const redemptionAmount = validatedRedemption?.redemption_amount ?? 0
  const paymentTotal = Math.max(
    0,
    canonicalSubtotal + shippingFee - promoDiscount - redemptionAmount
  )
  const membershipMetadata = buildMembershipOrderAccountingMetadata({
    subtotal: canonicalSubtotal,
    shipping_fee: shippingFee,
    promo_discount: promoDiscount,
    redeemed_points: validatedRedemption?.redeemable_points ?? 0,
    redemption_amount: redemptionAmount,
    redemption_reference: input.pointRedemption?.referenceId ?? null,
    payment_method: input.paymentMethod,
    shipping_method: input.shippingMethod,
    promo_code: input.promoCode ?? null,
    buyer_name: input.buyerName,
    buyer_phone: input.buyerPhone,
    buyer_email: input.buyerEmail,
    recipient_name: input.recipientName,
    recipient_phone: input.recipientPhone,
  })

  const { result } = await createOrderWorkflow(scope).run({
    input: {
      customer_id: input.customerId ?? undefined,
      email: input.buyerEmail,
      currency_code: "TWD",
      status: "completed",
      billing_address: {
        first_name: input.buyerName,
        address_1: "N/A",
        city: "Taipei",
        country_code: "tw",
        postal_code: "000",
        phone: input.buyerPhone,
      },
      shipping_address: {
        first_name: input.recipientName,
        address_1: "N/A",
        city: "Taipei",
        country_code: "tw",
        postal_code: "000",
        phone: input.recipientPhone,
      },
      items: buildOrderLineItems({
        items: input.items,
        promoDiscount,
        redemptionAmount,
      }),
      shipping_methods: [
        {
          name: input.shippingMethod === "store" ? "門市取貨" : "宅配到府",
          amount: shippingFee,
          data: {
            shipping_method: input.shippingMethod,
          },
        },
      ],
      metadata: {
        ...membershipMetadata,
        membership_delivery_note: toNullableString(input.deliveryNote),
        membership_expected_total: paymentTotal,
      },
    },
  })

  if (validatedRedemption && input.customerId) {
    const referenceId =
      toNullableString(input.pointRedemption?.referenceId) ??
      `order:${result.id}:redeem`
    const redemptionResult = await applyMembershipPointRedemption(scope, {
      customerId: input.customerId,
      referenceId,
      points: validatedRedemption.redeemable_points,
      actorType: "customer",
      actorId: input.customerId,
      note: `前台訂單 ${result.id} 點數折抵`,
      metadata: {
        order_id: result.id,
        order_subtotal: canonicalSubtotal,
        redemption_amount: validatedRedemption.redemption_amount,
      },
    })

    await updateOrderWorkflow(scope).run({
      input: {
        id: result.id,
        user_id: input.customerId,
        metadata: {
          ...membershipMetadata,
          membership_delivery_note: toNullableString(input.deliveryNote),
          membership_expected_total: paymentTotal,
          membership_redemption_reference: referenceId,
          membership_point_redemption_log_id: redemptionResult.point_log_id,
        },
      },
    })
  }

  await processOrderCompletionMembershipEffects(scope, {
    orderId: result.id,
    actorType: "system",
    actorId: "system",
  })

  const order = await retrieveStorefrontOrder(scope, result.id)

  if (!order) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Failed to retrieve the created order"
    )
  }

  return order
}
