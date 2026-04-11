import {
  getMembershipHistoryLabel,
  normalizeMembershipHistoryItem,
} from "../customer-membership-history"

describe("customer membership history helper", () => {
  it("returns a readable label for known membership actions", () => {
    const label = getMembershipHistoryLabel("customer.subscription.paused")

    expect(label).not.toBe("customer.subscription.paused")
    expect(typeof label).toBe("string")
    expect(label.length).toBeGreaterThan(0)
  })

  it("falls back to the raw action when no label mapping exists", () => {
    expect(getMembershipHistoryLabel("customer.unknown.action")).toBe(
      "customer.unknown.action"
    )
  })

  it("normalizes audit logs into membership history records", () => {
    const result = normalizeMembershipHistoryItem({
      id: "audit_1",
      action: "customer.pet.created",
      actor_type: "customer",
      actor_id: "cus_123",
      created_at: "2026-04-11T08:00:00.000Z",
      metadata: {
        pet_id: "pet_123",
      },
    } as never)

    expect(result).toEqual({
      id: "audit_1",
      action: "customer.pet.created",
      label: getMembershipHistoryLabel("customer.pet.created"),
      actor_type: "customer",
      actor_id: "cus_123",
      created_at: "2026-04-11T08:00:00.000Z",
      metadata: {
        pet_id: "pet_123",
      },
    })
  })
})
