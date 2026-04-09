import { summarizeMemberLevel } from "../helpers"

describe("membership admin helpers", () => {
  it("maps member level summary using the notion-aligned schema", () => {
    expect(
      summarizeMemberLevel({
        id: "level_gold",
        name: "Gold",
        sort_order: 30,
        reward_rate: 5,
        birthday_reward_rate: 8,
        upgrade_gift_points: 1200,
        upgrade_threshold: 50000,
        auto_upgrade: true,
        can_join_event: true,
        is_active: true,
      } as never)
    ).toEqual({
      id: "level_gold",
      name: "Gold",
      sort_order: 30,
      reward_rate: 5,
      birthday_reward_rate: 8,
      upgrade_gift_points: 1200,
      upgrade_threshold: 50000,
      auto_upgrade: true,
      can_join_event: true,
    })
  })
})
