import {
  calculateOrderRewardPoints,
  calculatePointExpirationDate,
  getBirthdayRewardDateForYear,
  isBirthdayRewardDate,
} from "../membership-points"

describe("membership points helpers", () => {
  const familyLevel = {
    id: "level_family",
    name: "家庭會員",
    reward_rate: 1,
    birthday_reward_rate: 5,
  }

  it("calculates order reward points from reward rate", () => {
    expect(
      calculateOrderRewardPoints({
        orderTotal: 12345,
        level: familyLevel,
        isBirthdayRewardDate: false,
      })
    ).toEqual({
      points: 123,
      applied_rate: 1,
      used_birthday_bonus: false,
      source: "order",
    })
  })

  it("uses birthday reward rate on the customer's birthday", () => {
    expect(
      calculateOrderRewardPoints({
        orderTotal: 12345,
        level: familyLevel,
        isBirthdayRewardDate: true,
      })
    ).toEqual({
      points: 617,
      applied_rate: 5,
      used_birthday_bonus: true,
      source: "birthday_bonus",
    })
  })

  it("returns zero points when no level is available", () => {
    expect(
      calculateOrderRewardPoints({
        orderTotal: 12345,
        level: null,
        isBirthdayRewardDate: false,
      })
    ).toEqual({
      points: 0,
      applied_rate: 0,
      used_birthday_bonus: false,
      source: "order",
    })
  })

  it("matches leap-year birthdays by clamping to the last valid day of the month", () => {
    expect(
      getBirthdayRewardDateForYear("1992-02-29T00:00:00.000Z", 2025).toISOString()
    ).toBe("2025-02-28T00:00:00.000Z")
    expect(
      isBirthdayRewardDate(
        "1992-02-29T00:00:00.000Z",
        "2025-02-28T10:00:00.000Z"
      )
    ).toBe(true)
    expect(
      isBirthdayRewardDate(
        "1992-02-29T00:00:00.000Z",
        "2025-03-01T10:00:00.000Z"
      )
    ).toBe(false)
  })

  it("writes a one-year expiration date using clamped calendar boundaries", () => {
    expect(
      calculatePointExpirationDate("2024-02-29T10:15:00.000Z").toISOString()
    ).toBe("2025-02-28T10:15:00.000Z")
  })
})
