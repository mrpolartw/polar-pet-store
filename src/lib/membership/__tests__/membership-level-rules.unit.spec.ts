import { selectMembershipLevelByYearlySpent } from "../membership-level-rules"

describe("membership level rules", () => {
  const levels = [
    {
      id: "level_family",
      sort_order: 10,
      upgrade_threshold: 0,
      auto_upgrade: true,
      is_active: true,
    },
    {
      id: "level_silver",
      sort_order: 20,
      upgrade_threshold: 5000,
      auto_upgrade: true,
      is_active: true,
    },
    {
      id: "level_gold",
      sort_order: 30,
      upgrade_threshold: 10000,
      auto_upgrade: true,
      is_active: true,
    },
    {
      id: "level_hidden",
      sort_order: 40,
      upgrade_threshold: 12000,
      auto_upgrade: false,
      is_active: true,
    },
    {
      id: "level_inactive",
      sort_order: 50,
      upgrade_threshold: 15000,
      auto_upgrade: true,
      is_active: false,
    },
  ]

  it("selects the highest eligible level by threshold and sort order", () => {
    expect(selectMembershipLevelByYearlySpent(levels, 12000)).toEqual({
      level: expect.objectContaining({
        id: "level_gold",
      }),
      matched_threshold: 10000,
      used_fallback_level: false,
    })
  })

  it("ignores inactive levels and levels that are not auto-upgrade enabled", () => {
    expect(selectMembershipLevelByYearlySpent(levels, 20000)).toEqual({
      level: expect.objectContaining({
        id: "level_gold",
      }),
      matched_threshold: 10000,
      used_fallback_level: false,
    })
  })

  it("falls back to the lowest active auto-upgrade level when nothing matches", () => {
    expect(selectMembershipLevelByYearlySpent(levels, -1)).toEqual({
      level: expect.objectContaining({
        id: "level_family",
      }),
      matched_threshold: 0,
      used_fallback_level: true,
    })
  })

  it("returns null when no active auto-upgrade levels exist", () => {
    expect(
      selectMembershipLevelByYearlySpent(
        levels.map((level) => ({
          ...level,
          is_active: false,
        })),
        1000
      )
    ).toEqual({
      level: null,
      matched_threshold: null,
      used_fallback_level: false,
    })
  })
})
