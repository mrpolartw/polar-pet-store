import {
  AdminCreateMemberLevel,
  AdminUpdateMemberLevel,
} from "../validators"

describe("admin member level validators", () => {
  it("accepts a valid notion-aligned member level payload", () => {
    expect(
      AdminCreateMemberLevel.parse({
        name: "VIP",
        sort_order: 10,
        reward_rate: 2,
        birthday_reward_rate: 3,
        upgrade_gift_points: 500,
        upgrade_threshold: 10000,
        auto_upgrade: true,
        can_join_event: true,
        is_active: true,
      })
    ).toEqual({
      name: "VIP",
      sort_order: 10,
      reward_rate: 2,
      birthday_reward_rate: 3,
      upgrade_gift_points: 500,
      upgrade_threshold: 10000,
      auto_upgrade: true,
      can_join_event: true,
      is_active: true,
    })
  })

  it("rejects invalid numeric values", () => {
    expect(() =>
      AdminCreateMemberLevel.parse({
        name: "VIP",
        sort_order: -1,
        reward_rate: -0.5,
        birthday_reward_rate: 3,
        upgrade_gift_points: 500,
        upgrade_threshold: 10000,
        auto_upgrade: true,
        can_join_event: true,
        is_active: true,
      })
    ).toThrow()

    expect(() =>
      AdminUpdateMemberLevel.parse({
        upgrade_threshold: "",
      })
    ).toThrow()
  })

  it("rejects missing required fields", () => {
    expect(() =>
      AdminCreateMemberLevel.parse({
        name: "  ",
        reward_rate: 2,
        birthday_reward_rate: 3,
        upgrade_gift_points: 500,
        upgrade_threshold: 10000,
        auto_upgrade: true,
        can_join_event: true,
        is_active: true,
      })
    ).toThrow()

    expect(() =>
      AdminCreateMemberLevel.parse({
        name: "VIP",
        sort_order: 10,
        reward_rate: 2,
        birthday_reward_rate: 3,
        upgrade_gift_points: 500,
        auto_upgrade: true,
        can_join_event: true,
        is_active: true,
      })
    ).toThrow()
  })
})
