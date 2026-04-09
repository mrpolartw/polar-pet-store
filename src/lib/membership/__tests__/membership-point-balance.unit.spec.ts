import {
  buildMembershipPointsSnapshot,
  computeAvailableMembershipPoints,
} from "../membership-point-balance"

describe("membership point balance helper", () => {
  it("computes available, expired, redeemed, and refunded points in mixed scenarios", () => {
    const logs = [
      {
        id: "pl_order",
        points: 100,
        balance_after: 100,
        source: "order",
        expired_at: "2027-01-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "pl_birthday",
        points: 50,
        balance_after: 150,
        source: "birthday_bonus",
        expired_at: "2027-02-01T00:00:00.000Z",
        created_at: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "pl_redeem",
        points: -80,
        balance_after: 70,
        source: "redeem",
        created_at: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "pl_refund",
        points: -20,
        balance_after: 50,
        source: "refund",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "pl_upgrade",
        points: 30,
        balance_after: 80,
        source: "upgrade_gift",
        expired_at: "2027-05-01T00:00:00.000Z",
        created_at: "2026-05-01T00:00:00.000Z",
      },
    ]

    const snapshot = buildMembershipPointsSnapshot(
      logs,
      "2027-02-15T00:00:00.000Z"
    )

    expect(snapshot.total_points).toBe(80)
    expect(snapshot.available_points).toBe(30)
    expect(snapshot.pending_expired_points).toBe(50)
    expect(snapshot.expired_points).toBe(50)
    expect(snapshot.redeemed_points).toBe(80)
    expect(snapshot.refunded_points).toBe(20)
    expect(snapshot.total_earned_points).toBe(180)
    expect(computeAvailableMembershipPoints(logs, "2027-02-15T00:00:00.000Z")).toBe(
      30
    )
  })

  it("does not count pending expired points as available on the expiration boundary", () => {
    const logs = [
      {
        id: "pl_order",
        points: 25,
        balance_after: 25,
        source: "order",
        expired_at: "2026-04-09T12:00:00.000Z",
        created_at: "2025-04-09T12:00:00.000Z",
      },
    ]

    const snapshot = buildMembershipPointsSnapshot(
      logs,
      "2026-04-09T12:00:00.000Z"
    )

    expect(snapshot.available_points).toBe(0)
    expect(snapshot.pending_expired_points).toBe(25)
    expect(snapshot.expired_points).toBe(25)
  })

  it("avoids double counting points that already have an expire log", () => {
    const logs = [
      {
        id: "pl_order",
        points: 40,
        balance_after: 40,
        source: "order",
        expired_at: "2026-04-01T00:00:00.000Z",
        created_at: "2025-04-01T00:00:00.000Z",
      },
      {
        id: "pl_expire",
        points: -40,
        balance_after: 0,
        source: "expire",
        reference_id: "expire:grant:pl_order",
        created_at: "2026-04-02T00:00:00.000Z",
      },
    ]

    const snapshot = buildMembershipPointsSnapshot(
      logs,
      "2026-04-10T00:00:00.000Z"
    )

    expect(snapshot.total_points).toBe(0)
    expect(snapshot.available_points).toBe(0)
    expect(snapshot.pending_expired_points).toBe(0)
    expect(snapshot.expired_points).toBe(40)
    expect(snapshot.expired_logged_points).toBe(40)
  })
})
