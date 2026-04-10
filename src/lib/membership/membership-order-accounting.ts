type JsonRecord = Record<string, unknown>

type MembershipOrderLike = {
  total?: number | string | null
  subtotal?: number | string | null
  shipping_total?: number | string | null
  discount_total?: number | string | null
  metadata?: Record<string, unknown> | null
}

export interface MembershipOrderAccountingMetadataInput {
  subtotal: number
  shipping_fee: number
  promo_discount: number
  redeemed_points: number
  redemption_amount: number
  redemption_reference: string | null
  payment_method: string | null
  shipping_method: string | null
  promo_code: string | null
  buyer_name: string | null
  buyer_phone: string | null
  buyer_email: string | null
  recipient_name: string | null
  recipient_phone: string | null
}

export interface MembershipOrderRefundHistoryEntry {
  reference_id: string
  original_refund_amount: number
  refund_applied_amount: number
  clawed_back_points: number
  actual_refund_amount: number
  point_log_id: string | null
  processed_at: string
}

function toFiniteNumber(value: unknown): number {
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  return Number.isFinite(normalized) ? normalized : 0
}

function normalizeNonNegativeInteger(value: unknown): number {
  return Math.max(0, Math.floor(toFiniteNumber(value)))
}

function asJsonRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as JsonRecord
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length ? trimmed : null
}

export function normalizeLookupPhone(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").replace(/\D/g, "")

  return normalized.length ? normalized : null
}

export function getMembershipOrderMetadata(
  order: MembershipOrderLike | null | undefined
): JsonRecord {
  return asJsonRecord(order?.metadata)
}

export function getMembershipOrderSubtotal(
  order: MembershipOrderLike | null | undefined
): number {
  const metadata = getMembershipOrderMetadata(order)

  if ("membership_order_subtotal" in metadata) {
    return normalizeNonNegativeInteger(metadata.membership_order_subtotal)
  }

  if ("subtotal" in metadata) {
    return normalizeNonNegativeInteger(metadata.subtotal)
  }

  if (order?.subtotal !== undefined && order?.subtotal !== null) {
    return normalizeNonNegativeInteger(order.subtotal)
  }

  return normalizeNonNegativeInteger(order?.total)
}

export function getMembershipOrderShippingFee(
  order: MembershipOrderLike | null | undefined
): number {
  const metadata = getMembershipOrderMetadata(order)

  if ("membership_shipping_fee" in metadata) {
    return normalizeNonNegativeInteger(metadata.membership_shipping_fee)
  }

  if (order?.shipping_total !== undefined && order?.shipping_total !== null) {
    return normalizeNonNegativeInteger(order.shipping_total)
  }

  return 0
}

export function getMembershipOrderPromoDiscount(
  order: MembershipOrderLike | null | undefined
): number {
  const metadata = getMembershipOrderMetadata(order)

  if ("membership_promo_discount" in metadata) {
    return normalizeNonNegativeInteger(metadata.membership_promo_discount)
  }

  if (order?.discount_total !== undefined && order?.discount_total !== null) {
    return normalizeNonNegativeInteger(order.discount_total)
  }

  return 0
}

export function getMembershipOrderRedemptionAmount(
  order: MembershipOrderLike | null | undefined
): number {
  const metadata = getMembershipOrderMetadata(order)

  if ("membership_redemption_amount" in metadata) {
    return normalizeNonNegativeInteger(metadata.membership_redemption_amount)
  }

  return 0
}

export function getMembershipOrderRedeemedPoints(
  order: MembershipOrderLike | null | undefined
): number {
  const metadata = getMembershipOrderMetadata(order)

  if ("membership_redeemed_points" in metadata) {
    return normalizeNonNegativeInteger(metadata.membership_redeemed_points)
  }

  return getMembershipOrderRedemptionAmount(order)
}

export function getMembershipOrderRefundedAmount(
  order: MembershipOrderLike | null | undefined
): number {
  const metadata = getMembershipOrderMetadata(order)

  if ("membership_refunded_amount" in metadata) {
    return normalizeNonNegativeInteger(metadata.membership_refunded_amount)
  }

  return 0
}

export function getMembershipOrderInitialRewardableTotal(
  order: MembershipOrderLike | null | undefined
): number {
  return Math.max(
    0,
    getMembershipOrderSubtotal(order) -
      getMembershipOrderPromoDiscount(order) -
      getMembershipOrderRedemptionAmount(order)
  )
}

export function getMembershipOrderRewardableTotal(
  order: MembershipOrderLike | null | undefined
): number {
  return Math.max(
    0,
    getMembershipOrderInitialRewardableTotal(order) -
      getMembershipOrderRefundedAmount(order)
  )
}

export function getMembershipOrderRefundReferences(
  order: MembershipOrderLike | null | undefined
): string[] {
  const metadata = getMembershipOrderMetadata(order)
  const references = metadata.membership_refund_references

  if (!Array.isArray(references)) {
    return []
  }

  return references
    .map((reference) => normalizeNullableString(reference))
    .filter((reference): reference is string => !!reference)
}

export function getMembershipOrderRefundHistory(
  order: MembershipOrderLike | null | undefined
): MembershipOrderRefundHistoryEntry[] {
  const metadata = getMembershipOrderMetadata(order)
  const refunds = metadata.membership_refunds

  if (!Array.isArray(refunds)) {
    return []
  }

  return refunds
    .map((entry) => {
      const record = asJsonRecord(entry)
      const referenceId = normalizeNullableString(record.reference_id)
      const processedAt = normalizeNullableString(record.processed_at)

      if (!referenceId || !processedAt) {
        return null
      }

      return {
        reference_id: referenceId,
        original_refund_amount: normalizeNonNegativeInteger(
          record.original_refund_amount
        ),
        refund_applied_amount: normalizeNonNegativeInteger(
          record.refund_applied_amount
        ),
        clawed_back_points: normalizeNonNegativeInteger(
          record.clawed_back_points
        ),
        actual_refund_amount: normalizeNonNegativeInteger(
          record.actual_refund_amount
        ),
        point_log_id: normalizeNullableString(record.point_log_id),
        processed_at: processedAt,
      }
    })
    .filter(
      (entry): entry is MembershipOrderRefundHistoryEntry => entry !== null
    )
}

export function buildMembershipOrderAccountingMetadata(
  input: MembershipOrderAccountingMetadataInput
): JsonRecord {
  return {
    membership_order_subtotal: normalizeNonNegativeInteger(input.subtotal),
    membership_shipping_fee: normalizeNonNegativeInteger(input.shipping_fee),
    membership_promo_discount: normalizeNonNegativeInteger(input.promo_discount),
    membership_redeemed_points: normalizeNonNegativeInteger(
      input.redeemed_points
    ),
    membership_redemption_amount: normalizeNonNegativeInteger(
      input.redemption_amount
    ),
    membership_redemption_reference:
      normalizeNullableString(input.redemption_reference),
    membership_refunded_amount: 0,
    membership_refund_references: [],
    membership_refunds: [],
    membership_payment_method: normalizeNullableString(input.payment_method),
    membership_shipping_method: normalizeNullableString(input.shipping_method),
    membership_promo_code: normalizeNullableString(input.promo_code),
    membership_buyer_name: normalizeNullableString(input.buyer_name),
    membership_buyer_phone: normalizeLookupPhone(input.buyer_phone),
    membership_buyer_email: normalizeNullableString(input.buyer_email),
    membership_recipient_name: normalizeNullableString(input.recipient_name),
    membership_recipient_phone: normalizeLookupPhone(input.recipient_phone),
    membership_lookup_phone:
      normalizeLookupPhone(input.recipient_phone) ??
      normalizeLookupPhone(input.buyer_phone),
  }
}

export function appendMembershipOrderRefundMetadata(
  order: MembershipOrderLike | null | undefined,
  entry: MembershipOrderRefundHistoryEntry
): JsonRecord {
  const metadata = getMembershipOrderMetadata(order)
  const refundReferences = getMembershipOrderRefundReferences(order)
  const refundHistory = getMembershipOrderRefundHistory(order)

  return {
    ...metadata,
    membership_refunded_amount:
      getMembershipOrderRefundedAmount(order) + entry.refund_applied_amount,
    membership_refund_references: Array.from(
      new Set([...refundReferences, entry.reference_id])
    ),
    membership_refunds: [...refundHistory, entry],
    membership_last_refund_at: entry.processed_at,
  }
}
