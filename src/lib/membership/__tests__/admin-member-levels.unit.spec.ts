import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import {
  assertMemberLevelCanBeDeleted,
  listAdminMemberLevels,
} from "../admin-member-levels"

describe("admin member levels helper", () => {
  const linkModule = {
    list: jest.fn(),
  }

  const link = {
    getLinkModule: jest.fn(() => linkModule),
  }

  const membershipService = {
    listMemberLevels: jest.fn(),
  }

  const scope = {
    resolve: jest.fn((key: unknown) => {
      if (key === MEMBERSHIP_MODULE) {
        return membershipService
      }

      if (key === ContainerRegistrationKeys.LINK) {
        return link
      }

      return undefined
    }),
  } as unknown as MedusaContainer

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("maps member count and active status for the list response", async () => {
    membershipService.listMemberLevels
      .mockResolvedValueOnce([
        {
          id: "level_vip",
          name: "VIP",
          sort_order: 10,
          reward_rate: 2,
          birthday_reward_rate: 3,
          upgrade_gift_points: 500,
          upgrade_threshold: 10000,
          auto_upgrade: true,
          can_join_event: true,
          is_active: true,
        },
        {
          id: "level_basic",
          name: "Basic",
          sort_order: 1,
          reward_rate: 1,
          birthday_reward_rate: 1,
          upgrade_gift_points: 0,
          upgrade_threshold: 0,
          auto_upgrade: false,
          can_join_event: false,
          is_active: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "level_vip",
        },
        {
          id: "level_basic",
        },
      ])

    linkModule.list.mockResolvedValue([
      {
        membership_member_level_id: "level_vip",
        customer_id: "cus_1",
      },
      {
        membership_member_level_id: "level_vip",
        customer_id: "cus_2",
      },
      {
        membership_member_level_id: "level_vip",
        customer_id: "cus_2",
      },
    ])

    const result = await listAdminMemberLevels(scope, {
      filters: {},
      pagination: {
        skip: 0,
        take: 20,
      },
    })

    expect(link.getLinkModule).toHaveBeenCalled()
    expect(linkModule.list).toHaveBeenCalledWith(
      {
        membership_member_level_id: ["level_vip", "level_basic"],
      },
      {
        select: ["membership_member_level_id", "customer_id"],
      }
    )
    expect(result.member_levels).toEqual([
      expect.objectContaining({
        id: "level_vip",
        is_active: true,
        member_count: 2,
      }),
      expect.objectContaining({
        id: "level_basic",
        is_active: false,
        member_count: 0,
      }),
    ])
    expect(result.metadata).toEqual({
      count: 2,
      skip: 0,
      take: 20,
    })
  })

  it("blocks deletion when members are still assigned", async () => {
    membershipService.listMemberLevels.mockResolvedValue([
      {
        id: "level_vip",
        name: "VIP",
        sort_order: 10,
        reward_rate: 2,
        birthday_reward_rate: 3,
        upgrade_gift_points: 500,
        upgrade_threshold: 10000,
        auto_upgrade: true,
        can_join_event: true,
        is_active: true,
      },
    ])
    linkModule.list.mockResolvedValue([
      {
        membership_member_level_id: "level_vip",
        customer_id: "cus_1",
      },
    ])

    await expect(
      assertMemberLevelCanBeDeleted(scope, "level_vip")
    ).rejects.toThrow(
      "目前仍有 1 位會員使用「VIP」，請先移轉會員後再刪除。"
    )
  })

  it("allows deletion when no members are assigned", async () => {
    membershipService.listMemberLevels.mockResolvedValue([
      {
        id: "level_basic",
        name: "Basic",
        sort_order: 1,
        reward_rate: 1,
        birthday_reward_rate: 1,
        upgrade_gift_points: 0,
        upgrade_threshold: 0,
        auto_upgrade: false,
        can_join_event: false,
        is_active: true,
      },
    ])
    linkModule.list.mockResolvedValue([])

    await expect(
      assertMemberLevelCanBeDeleted(scope, "level_basic")
    ).resolves.toBeUndefined()
  })
})
