import {
  appendMembershipOrderRefundMetadata,
  buildMembershipOrderAccountingMetadata,
  getMembershipOrderInitialRewardableTotal,
  getMembershipOrderRedemptionAmount,
  getMembershipOrderRefundedAmount,
  getMembershipOrderRewardableTotal,
} from "../membership-order-accounting"

describe("membership order accounting", () => {
  it("builds stable order accounting metadata for redemption-aware orders", () => {
    expect(
      buildMembershipOrderAccountingMetadata({
        subtotal: 2000,
        shipping_fee: 100,
        promo_discount: 120,
        redeemed_points: 300,
        redemption_amount: 300,
        redemption_reference: "order:ord_123:redeem",
        payment_method: "credit",
        shipping_method: "home",
        promo_code: "SPRING300",
        buyer_name: "王小明",
        buyer_phone: "0912-345-678",
        buyer_email: "member@example.com",
        recipient_name: "王小明",
        recipient_phone: "0912-345-678",
      })
    ).toEqual(
      expect.objectContaining({
        membership_order_subtotal: 2000,
        membership_shipping_fee: 100,
        membership_promo_discount: 120,
        membership_redeemed_points: 300,
        membership_redemption_amount: 300,
        membership_redemption_reference: "order:ord_123:redeem",
        membership_lookup_phone: "0912345678",
      })
    )
  })

  it("computes rewardable totals after promo, redemption, and refunds", () => {
    const order = {
      total: 1680,
      metadata: {
        membership_order_subtotal: 2000,
        membership_promo_discount: 120,
        membership_redemption_amount: 300,
        membership_refunded_amount: 400,
      },
    }

    expect(getMembershipOrderRedemptionAmount(order)).toBe(300)
    expect(getMembershipOrderInitialRewardableTotal(order)).toBe(1580)
    expect(getMembershipOrderRefundedAmount(order)).toBe(400)
    expect(getMembershipOrderRewardableTotal(order)).toBe(1180)
  })

  it("appends refund metadata without losing prior history", () => {
    const nextMetadata = appendMembershipOrderRefundMetadata(
      {
        metadata: {
          membership_refunded_amount: 200,
          membership_refund_references: ["refund:order:ord_123:1"],
          membership_refunds: [
            {
              reference_id: "refund:order:ord_123:1",
              original_refund_amount: 200,
              refund_applied_amount: 200,
              clawed_back_points: 4,
              actual_refund_amount: 196,
              point_log_id: "pl_refund_1",
              processed_at: "2026-04-10T09:00:00.000Z",
            },
          ],
        },
      },
      {
        reference_id: "refund:order:ord_123:2",
        original_refund_amount: 400,
        refund_applied_amount: 300,
        clawed_back_points: 6,
        actual_refund_amount: 394,
        point_log_id: "pl_refund_2",
        processed_at: "2026-04-10T10:00:00.000Z",
      }
    )

    expect(nextMetadata).toEqual(
      expect.objectContaining({
        membership_refunded_amount: 500,
        membership_refund_references: [
          "refund:order:ord_123:1",
          "refund:order:ord_123:2",
        ],
      })
    )
    expect(
      (nextMetadata.membership_refunds as Record<string, unknown>[]).length
    ).toBe(2)
  })
})
