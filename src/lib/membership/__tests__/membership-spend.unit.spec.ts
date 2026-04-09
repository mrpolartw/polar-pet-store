import {
  calculateAnniversaryYearlySpent,
  getMembershipYearCycleStart,
} from "../membership-spend"

describe("membership spend helpers", () => {
  it("returns the anniversary cycle start based on the first order date", () => {
    expect(
      getMembershipYearCycleStart(
        "2022-06-15T08:30:00.000Z",
        "2026-04-09T10:00:00.000Z"
      ).toISOString()
    ).toBe("2025-06-15T00:00:00.000Z")
  })

  it("calculates yearly spent using the anniversary cycle instead of calendar year", () => {
    const yearlySpent = calculateAnniversaryYearlySpent(
      [
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
})
