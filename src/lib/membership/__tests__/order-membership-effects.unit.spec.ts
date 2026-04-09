import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import {
  evaluateOrderRewardFromMembershipRules,
  processOrderCompletionMembershipEffects,
} from "../order-membership-effects"
import { recalculateCustomerMembershipLevel } from "../customer-membership-level"

jest.mock("../customer-membership-level", () => {
  const actual = jest.requireActual("../customer-membership-level")

  return {
    ...actual,
    recalculateCustomerMembershipLevel: jest.fn(),
  }
})

const recalculateCustomerMembershipLevelMock = jest.mocked(
  recalculateCustomerMembershipLevel
)

describe("order membership effects", () => {
  const levels = [
    {
      id: "level_family",
      name: "家庭會員",
      sort_order: 10,
      reward_rate: 1,
      birthday_reward_rate: 3,
      upgrade_gift_points: 0,
      upgrade_threshold: 0,
      auto_upgrade: true,
      can_join_event: false,
      is_active: true,
    },
    {
      id: "level_silver",
      name: "銀卡會員",
      sort_order: 20,
      reward_rate: 2,
      birthday_reward_rate: 4,
      upgrade_gift_points: 500,
      upgrade_threshold: 5000,
      auto_upgrade: true,
      can_join_event: true,
      is_active: true,
    },
  ]

  const orderRecords = [
    {
      id: "ord_first",
      customer_id: "cus_123",
      total: 100,
      currency_code: "TWD",
      created_at: "2026-01-01T00:00:00.000Z",
      status: "completed",
    },
    {
      id: "ord_previous",
      customer_id: "cus_123",
      total: 4400,
      currency_code: "TWD",
      created_at: "2026-03-01T00:00:00.000Z",
      status: "completed",
    },
    {
      id: "ord_target",
      customer_id: "cus_123",
      total: 1000,
      currency_code: "TWD",
      created_at: "2026-04-09T08:30:00.000Z",
      status: "completed",
    },
  ]

  const issuedLogs = new Map<string, Record<string, unknown>>()
  let currentBalance = 0

  const query = {
    graph: jest.fn(async (input: { filters?: Record<string, unknown> }) => {
      if (input.filters?.id === "ord_target") {
        return {
          data: [orderRecords[2]],
        }
      }

      if (input.filters?.customer_id === "cus_123") {
        return {
          data: [...orderRecords],
        }
      }

      return {
        data: [],
      }
    }),
  }

  const membershipService = {
    listMemberLevels: jest.fn(async () => [...levels]),
    getCustomerProfile: jest.fn(async () => ({
      id: "profile_123",
      customer_id: "cus_123",
      birthday: "1990-04-09T00:00:00.000Z",
    })),
    createPointLogOnce: jest.fn(
      async (input: {
        customer_id: string
        points: number
        source: string
        reference_id?: string | null
        note?: string | null
        expired_at?: Date | null
        metadata?: Record<string, unknown> | null
      }) => {
        const key = `${input.customer_id}:${input.source}:${input.reference_id ?? "null"}`
        const existing = issuedLogs.get(key)

        if (existing) {
          return {
            point_log: existing,
            created: false,
          }
        }

        currentBalance += input.points

        const pointLog = {
          id: `point_log_${issuedLogs.size + 1}`,
          customer_id: input.customer_id,
          points: input.points,
          balance_after: currentBalance,
          source: input.source,
          reference_id: input.reference_id ?? null,
          note: input.note ?? null,
          expired_at: input.expired_at ?? null,
          metadata: input.metadata ?? null,
        }

        issuedLogs.set(key, pointLog)

        return {
          point_log: pointLog,
          created: true,
        }
      }
    ),
    createAuditLog: jest.fn(async (payload) => payload),
  }

  const scope = {
    resolve: jest.fn((key: unknown) => {
      if (key === ContainerRegistrationKeys.QUERY) {
        return query
      }

      if (key === MEMBERSHIP_MODULE) {
        return membershipService
      }

      throw new Error(`Unexpected resolve key: ${String(key)}`)
    }),
  } as unknown as MedusaContainer

  beforeEach(() => {
    jest.clearAllMocks()
    issuedLogs.clear()
    currentBalance = 0

    recalculateCustomerMembershipLevelMock.mockResolvedValue({
      customer_id: "cus_123",
      previous_level: {
        id: "level_family",
        name: "家庭會員",
        sort_order: 10,
        reward_rate: 1,
        birthday_reward_rate: 3,
        upgrade_gift_points: 0,
        upgrade_threshold: 0,
        auto_upgrade: true,
        can_join_event: false,
      },
      current_level: {
        id: "level_silver",
        name: "銀卡會員",
        sort_order: 20,
        reward_rate: 2,
        birthday_reward_rate: 4,
        upgrade_gift_points: 500,
        upgrade_threshold: 5000,
        auto_upgrade: true,
        can_join_event: true,
      },
      resolved_level: levels[1] as never,
      changed: true,
      yearly_spent: 5500,
      total_spent: 5500,
      currency_code: "TWD",
      first_order_at: "2026-01-01T00:00:00.000Z",
      cycle_start: "2026-01-01T00:00:00.000Z",
      matched_threshold: 5000,
      used_fallback_level: false,
    } as never)
  })

  it("calculates the order reward from the prior applicable level and birthday bonus", () => {
    expect(
      evaluateOrderRewardFromMembershipRules({
        order: orderRecords[2],
        orders: orderRecords,
        levels,
        birthday: "1990-04-09T00:00:00.000Z",
      })
    ).toEqual(
      expect.objectContaining({
        reward_level: expect.objectContaining({
          id: "level_family",
        }),
        points: 30,
        applied_rate: 3,
        used_birthday_bonus: true,
        source: "birthday_bonus",
      })
    )
  })

  it("awards order points, recalculates the level, and issues an upgrade gift once", async () => {
    const result = await processOrderCompletionMembershipEffects(scope, {
      orderId: "ord_target",
      processedAt: "2026-04-09T12:00:00.000Z",
    })

    expect(result).toEqual(
      expect.objectContaining({
        order_id: "ord_target",
        customer_id: "cus_123",
        reward: expect.objectContaining({
          points: 30,
          created: true,
          source: "birthday_bonus",
          applied_rate: 3,
          used_birthday_bonus: true,
          expires_at: "2027-04-09T12:00:00.000Z",
        }),
        upgrade_gift: expect.objectContaining({
          points: 500,
          created: true,
          expires_at: "2027-04-09T12:00:00.000Z",
        }),
      })
    )
    expect(
      membershipService.createPointLogOnce.mock.invocationCallOrder[0]
    ).toBeLessThan(
      recalculateCustomerMembershipLevelMock.mock.invocationCallOrder[0]
    )
    expect(
      membershipService.createPointLogOnce.mock.invocationCallOrder[1]
    ).toBeGreaterThan(
      recalculateCustomerMembershipLevelMock.mock.invocationCallOrder[0]
    )
    expect(membershipService.createAuditLog).toHaveBeenCalledTimes(2)
    expect(membershipService.createPointLogOnce).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        source: "birthday_bonus",
        reference_id: "ord_target",
      })
    )
    expect(membershipService.createPointLogOnce).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        source: "upgrade_gift",
        reference_id: "order:ord_target:upgrade:level_family:level_silver",
      })
    )
  })

  it("does not duplicate order rewards or upgrade gifts when the same order is processed twice", async () => {
    await processOrderCompletionMembershipEffects(scope, {
      orderId: "ord_target",
      processedAt: "2026-04-09T12:00:00.000Z",
    })
    await processOrderCompletionMembershipEffects(scope, {
      orderId: "ord_target",
      processedAt: "2026-04-09T12:00:00.000Z",
    })

    expect(issuedLogs.size).toBe(2)
    expect(membershipService.createAuditLog).toHaveBeenCalledTimes(2)
  })

  it("does not issue an upgrade gift when the level does not change", async () => {
    recalculateCustomerMembershipLevelMock.mockResolvedValueOnce({
      customer_id: "cus_123",
      previous_level: {
        id: "level_family",
        name: "家庭會員",
        sort_order: 10,
        reward_rate: 1,
        birthday_reward_rate: 3,
        upgrade_gift_points: 0,
        upgrade_threshold: 0,
        auto_upgrade: true,
        can_join_event: false,
      },
      current_level: {
        id: "level_family",
        name: "家庭會員",
        sort_order: 10,
        reward_rate: 1,
        birthday_reward_rate: 3,
        upgrade_gift_points: 0,
        upgrade_threshold: 0,
        auto_upgrade: true,
        can_join_event: false,
      },
      resolved_level: levels[0] as never,
      changed: false,
      yearly_spent: 4500,
      total_spent: 5500,
      currency_code: "TWD",
      first_order_at: "2026-01-01T00:00:00.000Z",
      cycle_start: "2026-01-01T00:00:00.000Z",
      matched_threshold: 0,
      used_fallback_level: false,
    } as never)

    const result = await processOrderCompletionMembershipEffects(scope, {
      orderId: "ord_target",
      processedAt: "2026-04-09T12:00:00.000Z",
    })

    expect(result?.upgrade_gift).toEqual({
      points: 0,
      created: false,
      point_log_id: null,
      expires_at: null,
    })
    expect(membershipService.createPointLogOnce).toHaveBeenCalledTimes(1)
  })
})
