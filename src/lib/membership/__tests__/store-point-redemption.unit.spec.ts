import { validateMembershipPointRedemption } from "../store-point-redemption"

describe("store point redemption validation", () => {
  it("accepts a valid redemption within available points and subtotal", () => {
    expect(
      validateMembershipPointRedemption({
        availablePoints: 120,
        requestedPoints: 40,
        orderSubtotal: 90,
      })
    ).toEqual({
      requested_points: 40,
      available_points: 120,
      max_redeemable_points: 90,
      redeemable_points: 40,
      redemption_amount: 40,
      order_subtotal: 90,
      remaining_amount: 50,
      is_valid: true,
      validation_message: null,
    })
  })

  it("rejects redemptions that exceed available points", () => {
    expect(
      validateMembershipPointRedemption({
        availablePoints: 25,
        requestedPoints: 40,
        orderSubtotal: 200,
      })
    ).toEqual(
      expect.objectContaining({
        max_redeemable_points: 25,
        redeemable_points: 25,
        is_valid: false,
        validation_message: "折抵點數不可超過可用點數",
      })
    )
  })

  it("rejects redemptions that exceed the order subtotal", () => {
    expect(
      validateMembershipPointRedemption({
        availablePoints: 300,
        requestedPoints: 120,
        orderSubtotal: 80,
      })
    ).toEqual(
      expect.objectContaining({
        max_redeemable_points: 80,
        redeemable_points: 80,
        is_valid: false,
        validation_message: "折抵點數不可超過本次可折抵金額",
      })
    )
  })

  it("treats zero-point preview as a valid empty state", () => {
    expect(
      validateMembershipPointRedemption({
        availablePoints: 100,
        requestedPoints: 0,
        orderSubtotal: 80,
      })
    ).toEqual(
      expect.objectContaining({
        redeemable_points: 0,
        is_valid: true,
        validation_message: null,
      })
    )
  })
})
