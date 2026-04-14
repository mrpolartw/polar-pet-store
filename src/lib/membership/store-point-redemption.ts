export interface MembershipPointRedemptionValidationInput {
  availablePoints: number
  requestedPoints: number
  orderSubtotal: number
}

export interface MembershipPointRedemptionValidationResult {
  requested_points: number
  available_points: number
  max_redeemable_points: number
  redeemable_points: number
  redemption_amount: number
  order_subtotal: number
  remaining_amount: number
  is_valid: boolean
  validation_message: string | null
}

function normalizeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

export function validateMembershipPointRedemption(
  input: MembershipPointRedemptionValidationInput
): MembershipPointRedemptionValidationResult {
  const availablePoints = normalizeInteger(input.availablePoints)
  const requestedPoints = Number(input.requestedPoints)
  const orderSubtotal = normalizeInteger(input.orderSubtotal)
  const maxRedeemablePoints = Math.min(availablePoints, orderSubtotal)

  if (!Number.isFinite(requestedPoints) || !Number.isInteger(requestedPoints)) {
    return {
      requested_points: 0,
      available_points: availablePoints,
      max_redeemable_points: maxRedeemablePoints,
      redeemable_points: 0,
      redemption_amount: 0,
      order_subtotal: orderSubtotal,
      remaining_amount: orderSubtotal,
      is_valid: false,
      validation_message: '請輸入正整數點數。',
    }
  }

  if (requestedPoints < 0) {
    return {
      requested_points: requestedPoints,
      available_points: availablePoints,
      max_redeemable_points: maxRedeemablePoints,
      redeemable_points: 0,
      redemption_amount: 0,
      order_subtotal: orderSubtotal,
      remaining_amount: orderSubtotal,
      is_valid: false,
      validation_message: '點數折抵不得小於 0。',
    }
  }

  if (requestedPoints === 0) {
    return {
      requested_points: 0,
      available_points: availablePoints,
      max_redeemable_points: maxRedeemablePoints,
      redeemable_points: 0,
      redemption_amount: 0,
      order_subtotal: orderSubtotal,
      remaining_amount: orderSubtotal,
      is_valid: true,
      validation_message: null,
    }
  }

  if (requestedPoints > availablePoints) {
    return {
      requested_points: requestedPoints,
      available_points: availablePoints,
      max_redeemable_points: maxRedeemablePoints,
      redeemable_points: maxRedeemablePoints,
      redemption_amount: maxRedeemablePoints,
      order_subtotal: orderSubtotal,
      remaining_amount: Math.max(0, orderSubtotal - maxRedeemablePoints),
      is_valid: false,
      validation_message: '點數折抵不得超過目前可用點數。',
    }
  }

  if (requestedPoints > orderSubtotal) {
    return {
      requested_points: requestedPoints,
      available_points: availablePoints,
      max_redeemable_points: maxRedeemablePoints,
      redeemable_points: maxRedeemablePoints,
      redemption_amount: maxRedeemablePoints,
      order_subtotal: orderSubtotal,
      remaining_amount: Math.max(0, orderSubtotal - maxRedeemablePoints),
      is_valid: false,
      validation_message: '點數折抵不得超過本次可折抵金額。',
    }
  }

  return {
    requested_points: requestedPoints,
    available_points: availablePoints,
    max_redeemable_points: maxRedeemablePoints,
    redeemable_points: requestedPoints,
    redemption_amount: requestedPoints,
    order_subtotal: orderSubtotal,
    remaining_amount: Math.max(0, orderSubtotal - requestedPoints),
    is_valid: true,
    validation_message: null,
  }
}
