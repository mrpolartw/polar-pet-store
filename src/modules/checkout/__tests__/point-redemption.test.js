import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCheckoutSummary,
  validateRedeemablePoints,
} from '../pointRedemption.js'

test('validateRedeemablePoints accepts valid integer redemption input', () => {
  assert.deepEqual(
    validateRedeemablePoints({
      availablePoints: 120,
      requestedPoints: 40,
      orderSubtotal: 90,
    }),
    {
      requestedPoints: 40,
      availablePoints: 120,
      maxRedeemablePoints: 90,
      redeemablePoints: 40,
      redemptionAmount: 40,
      orderSubtotal: 90,
      remainingAmount: 50,
      isValid: true,
      validationMessage: null,
    }
  )
})

test('validateRedeemablePoints rejects negative and over-limit inputs', () => {
  assert.equal(
    validateRedeemablePoints({
      availablePoints: 100,
      requestedPoints: -1,
      orderSubtotal: 80,
    }).validationMessage,
    '折抵點數不可小於 0。'
  )

  assert.equal(
    validateRedeemablePoints({
      availablePoints: 20,
      requestedPoints: 30,
      orderSubtotal: 80,
    }).validationMessage,
    '折抵點數不可超過目前可用點數。'
  )

  assert.equal(
    validateRedeemablePoints({
      availablePoints: 100,
      requestedPoints: 90,
      orderSubtotal: 50,
    }).validationMessage,
    '折抵點數不可超過本次訂單可折抵金額。'
  )
})

test('buildCheckoutSummary calculates totals before and after point redemption', () => {
  assert.deepEqual(
    buildCheckoutSummary({
      subtotal: 1800,
      shippingFee: 100,
      promoDiscount: 200,
      redeemedPoints: 150,
    }),
    {
      subtotal: 1800,
      shippingFee: 100,
      promoDiscount: 200,
      redeemedPoints: 150,
      totalBeforePoints: 1700,
      total: 1550,
    }
  )
})
