function normalizeInteger(value) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.max(0, Math.floor(numeric))
}

export function validateRedeemablePoints({
  availablePoints,
  requestedPoints,
  orderSubtotal,
}) {
  const normalizedAvailablePoints = normalizeInteger(availablePoints)
  const normalizedSubtotal = normalizeInteger(orderSubtotal)
  const numericRequestedPoints = Number(requestedPoints)
  const maxRedeemablePoints = Math.min(
    normalizedAvailablePoints,
    normalizedSubtotal
  )

  if (!Number.isFinite(numericRequestedPoints) || !Number.isInteger(numericRequestedPoints)) {
    return {
      requestedPoints: 0,
      availablePoints: normalizedAvailablePoints,
      maxRedeemablePoints,
      redeemablePoints: 0,
      redemptionAmount: 0,
      orderSubtotal: normalizedSubtotal,
      remainingAmount: normalizedSubtotal,
      isValid: false,
      validationMessage: '折抵點數必須是正整數。',
    }
  }

  if (numericRequestedPoints < 0) {
    return {
      requestedPoints: numericRequestedPoints,
      availablePoints: normalizedAvailablePoints,
      maxRedeemablePoints,
      redeemablePoints: 0,
      redemptionAmount: 0,
      orderSubtotal: normalizedSubtotal,
      remainingAmount: normalizedSubtotal,
      isValid: false,
      validationMessage: '折抵點數不可小於 0。',
    }
  }

  if (numericRequestedPoints === 0) {
    return {
      requestedPoints: 0,
      availablePoints: normalizedAvailablePoints,
      maxRedeemablePoints,
      redeemablePoints: 0,
      redemptionAmount: 0,
      orderSubtotal: normalizedSubtotal,
      remainingAmount: normalizedSubtotal,
      isValid: true,
      validationMessage: null,
    }
  }

  if (numericRequestedPoints > normalizedAvailablePoints) {
    return {
      requestedPoints: numericRequestedPoints,
      availablePoints: normalizedAvailablePoints,
      maxRedeemablePoints,
      redeemablePoints: maxRedeemablePoints,
      redemptionAmount: maxRedeemablePoints,
      orderSubtotal: normalizedSubtotal,
      remainingAmount: Math.max(0, normalizedSubtotal - maxRedeemablePoints),
      isValid: false,
      validationMessage: '折抵點數不可超過目前可用點數。',
    }
  }

  if (numericRequestedPoints > normalizedSubtotal) {
    return {
      requestedPoints: numericRequestedPoints,
      availablePoints: normalizedAvailablePoints,
      maxRedeemablePoints,
      redeemablePoints: maxRedeemablePoints,
      redemptionAmount: maxRedeemablePoints,
      orderSubtotal: normalizedSubtotal,
      remainingAmount: Math.max(0, normalizedSubtotal - maxRedeemablePoints),
      isValid: false,
      validationMessage: '折抵點數不可超過本次訂單可折抵金額。',
    }
  }

  return {
    requestedPoints: numericRequestedPoints,
    availablePoints: normalizedAvailablePoints,
    maxRedeemablePoints,
    redeemablePoints: numericRequestedPoints,
    redemptionAmount: numericRequestedPoints,
    orderSubtotal: normalizedSubtotal,
    remainingAmount: Math.max(0, normalizedSubtotal - numericRequestedPoints),
    isValid: true,
    validationMessage: null,
  }
}

export function buildCheckoutSummary({
  subtotal,
  shippingFee = 0,
  promoDiscount = 0,
  redeemedPoints = 0,
}) {
  const normalizedSubtotal = normalizeInteger(subtotal)
  const normalizedShippingFee = normalizeInteger(shippingFee)
  const normalizedPromoDiscount = normalizeInteger(promoDiscount)
  const normalizedRedeemedPoints = normalizeInteger(redeemedPoints)
  const totalBeforePoints = Math.max(
    0,
    normalizedSubtotal + normalizedShippingFee - normalizedPromoDiscount
  )
  const total = Math.max(0, totalBeforePoints - normalizedRedeemedPoints)

  return {
    subtotal: normalizedSubtotal,
    shippingFee: normalizedShippingFee,
    promoDiscount: normalizedPromoDiscount,
    redeemedPoints: normalizedRedeemedPoints,
    totalBeforePoints,
    total,
  }
}
