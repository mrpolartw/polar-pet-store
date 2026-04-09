import {
  buildMembershipSpendSnapshot,
  calculateAnniversaryYearlySpent,
  getFirstMembershipOrderDate,
  getMembershipYearCycleStart,
} from "../membership-spend"

describe("membership spend helpers", () => {
  it("returns the anniversary cycle start based on the first valid order date", () => {
    expect(
      getMembershipYearCycleStart(
        "2022-06-15T08:30:00.000Z",
        "2026-04-09T10:00:00.000Z"
      ).toISOString()
    ).toBe("2025-06-15T00:00:00.000Z")
  })

  it("handles leap-year and month-end anniversaries safely", () => {
    expect(
      getMembershipYearCycleStart(
        "2024-02-29T09:00:00.000Z",
        "2025-03-01T00:00:00.000Z"
      ).toISOString()
    ).toBe("2025-02-28T00:00:00.000Z")

    expect(
      getMembershipYearCycleStart(
        "2022-03-31T09:00:00.000Z",
        "2023-03-30T00:00:00.000Z"
      ).toISOString()
    ).toBe("2022-03-31T00:00:00.000Z")
  })

  it("uses the first completed order instead of pending orders as the annual anchor", () => {
    expect(
      getFirstMembershipOrderDate([
        {
          total: 100,
          created_at: "2022-01-01T00:00:00.000Z",
          status: "pending",
        },
        {
          total: 200,
          created_at: "2022-03-15T00:00:00.000Z",
          status: "completed",
        },
      ])?.toISOString()
    ).toBe("2022-03-15T00:00:00.000Z")
  })

  it("calculates yearly spent using the current anniversary cycle and valid orders only", () => {
    const yearlySpent = calculateAnniversaryYearlySpent(
      [
        {
          total: 500,
          created_at: "2022-06-10T00:00:00.000Z",
          status: "pending",
        },
        {
          total: 500,
          created_at: "2022-06-15T00:00:00.000Z",
          status: "completed",
        },
        {
          total: 100,
          created_at: "2025-06-14T00:00:00.000Z",
          status: "completed",
        },
        {
          total: 200,
          created_at: "2025-06-15T00:00:00.000Z",
          status: "completed",
        },
        {
          total: 300,
          created_at: "2026-01-10T00:00:00.000Z",
          status: "archived",
        },
        {
          total: 400,
          created_at: "2026-04-08T00:00:00.000Z",
          status: "completed",
        },
        {
          total: 999,
          created_at: "2026-04-10T00:00:00.000Z",
          status: "completed",
        },
        {
          total: 888,
          created_at: "2026-03-01T00:00:00.000Z",
          status: "pending",
        },
      ],
      "2026-04-09T10:00:00.000Z"
    )

    expect(yearlySpent).toBe(900)
  })

  it("builds the full spending snapshot for the active anniversary cycle", () => {
    expect(
      buildMembershipSpendSnapshot(
        [
          {
            total: 1000,
            created_at: "2022-03-15T00:00:00.000Z",
            status: "completed",
          },
          {
            total: 500,
            created_at: "2025-03-14T00:00:00.000Z",
            status: "completed",
          },
          {
            total: 1200,
            created_at: "2025-03-15T00:00:00.000Z",
            status: "completed",
          },
          {
            total: 800,
            created_at: "2025-12-20T00:00:00.000Z",
            status: "archived",
          },
        ],
        "2026-01-10T00:00:00.000Z"
      )
    ).toEqual({
      first_order_at: new Date("2022-03-15T00:00:00.000Z"),
      cycle_start: new Date("2025-03-15T00:00:00.000Z"),
      total_spent: 3500,
      yearly_spent: 2000,
    })
  })
})
