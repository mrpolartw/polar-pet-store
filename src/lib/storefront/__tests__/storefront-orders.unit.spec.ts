import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import { createStorefrontOrder } from "../storefront-orders"
import { applyMembershipPointRedemption } from "../../membership/membership-point-effects"
import { processOrderCompletionMembershipEffects } from "../../membership/order-membership-effects"

const createOrderRunMock = jest.fn()
const updateOrderRunMock = jest.fn()

jest.mock("@medusajs/core-flows", () => ({
  createOrderWorkflow: jest.fn(() => ({
    run: createOrderRunMock,
  })),
  updateOrderWorkflow: jest.fn(() => ({
    run: updateOrderRunMock,
  })),
}))

jest.mock("../../membership/membership-point-effects", () => ({
  applyMembershipPointRedemption: jest.fn(),
}))

jest.mock("../../membership/order-membership-effects", () => ({
  processOrderCompletionMembershipEffects: jest.fn(),
}))

const applyMembershipPointRedemptionMock = jest.mocked(
  applyMembershipPointRedemption
)
const processOrderCompletionMembershipEffectsMock = jest.mocked(
  processOrderCompletionMembershipEffects
)

describe("storefront order flow", () => {
  let latestMetadata: Record<string, unknown> | null
  let createdItems: Record<string, unknown>[]

  function buildScope(): MedusaContainer {
    const membershipService = {
      getCustomerPoints: jest.fn(async () => ({
        balance: 600,
        available_balance: 600,
        summary: {
          total_points: 600,
          available_points: 600,
        },
      })),
    }

    const query = {
      graph: jest.fn(async () => ({
        data: [
          {
            id: "order_123",
            status: "completed",
            customer_id: "cus_123",
            email: "member@example.com",
            total: 1550,
            subtotal: 1550,
            shipping_total: 100,
            discount_total: 0,
            currency_code: "TWD",
            created_at: "2026-04-10T12:00:00.000Z",
            metadata: latestMetadata,
            items: createdItems,
            shipping_address: {
              first_name: "王小明",
              phone: "0912345678",
            },
          },
        ],
      })),
    }

    return {
      resolve: jest.fn((key: unknown) => {
        if (key === MEMBERSHIP_MODULE) {
          return membershipService
        }

        if (key === ContainerRegistrationKeys.QUERY) {
          return query
        }

        throw new Error(`Unexpected resolve key: ${String(key)}`)
      }),
    } as unknown as MedusaContainer
  }

  beforeEach(() => {
    jest.clearAllMocks()
    latestMetadata = null
    createdItems = []

    createOrderRunMock.mockImplementation(async ({ input }) => {
      latestMetadata = (input.metadata ?? null) as Record<string, unknown> | null
      createdItems = (input.items ?? []).map((item, index) => ({
        id: `item_${index + 1}`,
        title: item.title,
        subtitle: item.subtitle ?? null,
        thumbnail: item.thumbnail ?? null,
        product_id: item.product_id ?? null,
        variant_id: item.variant_id ?? null,
        variant_title: item.variant_title ?? null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        metadata: item.metadata ?? null,
      }))

      return {
        result: {
          id: "order_123",
        },
      }
    })

    updateOrderRunMock.mockImplementation(async ({ input }) => {
      latestMetadata = input.metadata ?? latestMetadata

      return { result: {} }
    })

    applyMembershipPointRedemptionMock.mockResolvedValue({
      customer_id: "cus_123",
      reference_id: "order:order_123:redeem",
      redeemed_points: 150,
      redemption_amount: 150,
      created: true,
      point_log_id: "pl_redeem_123",
      available_points_before: 600,
      available_points_after: 450,
    } as never)

    processOrderCompletionMembershipEffectsMock.mockResolvedValue(null as never)
  })

  it("creates a storefront order with redemption metadata and synced point log reference", async () => {
    const scope = buildScope()

    const order = await createStorefrontOrder(scope, {
      customerId: "cus_123",
      shippingMethod: "home",
      paymentMethod: "credit",
      buyerName: "王小明",
      buyerEmail: "member@example.com",
      buyerPhone: "0912345678",
      recipientName: "王小明",
      recipientPhone: "0912345678",
      promoCode: "SPRING200",
      subtotal: 1800,
      shippingFee: 100,
      discount: 200,
      total: 1550,
      items: [
        {
          id: "item_a",
          productId: "prod_a",
          variantId: "variant_a",
          name: "鮮食餐盒",
          specs: "雞肉口味",
          image: "https://example.com/a.jpg",
          price: 900,
          quantity: 2,
        },
      ],
      pointRedemption: {
        requestedPoints: 150,
        redeemedPoints: 150,
        redemptionAmount: 150,
        referenceId: "order:order_123:redeem",
        orderSubtotal: 1800,
      },
    })

    expect(createOrderRunMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          metadata: expect.objectContaining({
            membership_order_subtotal: 1800,
            membership_promo_discount: 200,
            membership_redeemed_points: 150,
            membership_redemption_amount: 150,
          }),
        }),
      })
    )
    expect(updateOrderRunMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          id: "order_123",
          metadata: expect.objectContaining({
            membership_redemption_reference: "order:order_123:redeem",
            membership_point_redemption_log_id: "pl_redeem_123",
          }),
        }),
      })
    )
    expect(applyMembershipPointRedemptionMock).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({
        customerId: "cus_123",
        referenceId: "order:order_123:redeem",
        points: 150,
      })
    )
    expect(processOrderCompletionMembershipEffectsMock).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({
        orderId: "order_123",
      })
    )
    expect(order.pointRedemptionAmount).toBe(150)
    expect(order.total).toBe(1550)
    expect(order.items).toHaveLength(2)
    expect(order.items[0]).toEqual(
      expect.objectContaining({
        name: "鮮食餐盒",
        quantity: 1,
      })
    )
  })
})
