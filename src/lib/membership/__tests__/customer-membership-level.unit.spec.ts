import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import {
  buildCustomerMembershipLevelMap,
  recalculateCustomerMembershipLevel,
} from "../customer-membership-level"
import { retrieveCustomerWithMembershipLevel } from "../customer-membership"

jest.mock("../customer-membership", () => ({
  retrieveCustomerWithMembershipLevel: jest.fn(),
}))

const retrieveCustomerWithMembershipLevelMock = jest.mocked(
  retrieveCustomerWithMembershipLevel
)

describe("customer membership level helper", () => {
  const notionLevels = [
    {
      id: "level_family",
      name: "家庭會員",
      sort_order: 10,
      reward_rate: 1,
      birthday_reward_rate: 1,
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
      birthday_reward_rate: 2,
      upgrade_gift_points: 100,
      upgrade_threshold: 5000,
      auto_upgrade: true,
      can_join_event: true,
      is_active: true,
    },
    {
      id: "level_black",
      name: "黑卡會員",
      sort_order: 40,
      reward_rate: 5,
      birthday_reward_rate: 6,
      upgrade_gift_points: 800,
      upgrade_threshold: 15000,
      auto_upgrade: false,
      can_join_event: true,
      is_active: true,
    },
  ]

  const currentCustomer = {
    id: "cus_123",
    membership_member_level: {
      id: "level_family",
      name: "家庭會員",
      sort_order: 10,
      reward_rate: 1,
      birthday_reward_rate: 1,
      upgrade_gift_points: 0,
      upgrade_threshold: 0,
      auto_upgrade: true,
      can_join_event: false,
      is_active: true,
    },
  }

  const query = {
    graph: jest.fn(),
  }

  const membershipService = {
    listMemberLevels: jest.fn(),
    createAuditLog: jest.fn(async (payload) => payload),
  }

  const link = {
    create: jest.fn(async () => []),
    dismiss: jest.fn(async () => []),
  }

  const scope = {
    resolve: jest.fn((key: unknown) => {
      if (key === MEMBERSHIP_MODULE) {
        return membershipService
      }

      if (key === ContainerRegistrationKeys.QUERY) {
        return query
      }

      if (key === ContainerRegistrationKeys.LINK) {
        return link
      }

      throw new Error(`Unexpected resolve key: ${String(key)}`)
    }),
  } as unknown as MedusaContainer

  beforeEach(() => {
    jest.clearAllMocks()

    retrieveCustomerWithMembershipLevelMock.mockResolvedValue(
      currentCustomer as never
    )

    membershipService.listMemberLevels.mockResolvedValue([
      ...notionLevels,
    ])
  })

  it("builds a customer level map using anniversary yearly spend", () => {
    const result = buildCustomerMembershipLevelMap({
      customerIds: ["cus_123"],
      levels: notionLevels,
      orders: [
        {
          customer_id: "cus_123",
          total: 1000,
          currency_code: "TWD",
          created_at: "2022-03-15T00:00:00.000Z",
          status: "completed",
        },
        {
          customer_id: "cus_123",
          total: 5200,
          currency_code: "TWD",
          created_at: "2025-03-16T00:00:00.000Z",
          status: "completed",
        },
      ],
      referenceAt: "2026-01-10T00:00:00.000Z",
    })

    expect(result.get("cus_123")).toEqual(
      expect.objectContaining({
        yearly_spent: 5200,
        current_level: expect.objectContaining({
          id: "level_silver",
        }),
      })
    )
  })

  it("recalculates a customer's level and writes an audit log when the level changes", async () => {
    query.graph.mockResolvedValue({
      data: [
        {
          id: "ord_first",
          customer_id: "cus_123",
          total: 1000,
          currency_code: "TWD",
          created_at: "2022-03-15T00:00:00.000Z",
          status: "completed",
        },
        {
          id: "ord_current_cycle",
          customer_id: "cus_123",
          total: 6000,
          currency_code: "TWD",
          created_at: "2026-03-20T00:00:00.000Z",
          status: "completed",
        },
      ],
    })

    const result = await recalculateCustomerMembershipLevel(scope, {
      customerId: "cus_123",
      actorType: "admin",
      actorId: "user_123",
      reason: "manual_recalculation",
      action: "customer.membership_level.recalculated_by_admin",
      ipAddress: "127.0.0.1",
    })

    expect(result.changed).toBe(true)
    expect(result.current_level).toEqual({
      id: "level_silver",
      name: "銀卡會員",
      sort_order: 20,
      reward_rate: 2,
      birthday_reward_rate: 2,
      upgrade_gift_points: 100,
      upgrade_threshold: 5000,
      auto_upgrade: true,
      can_join_event: true,
    })
    expect(result.yearly_spent).toBe(6000)
    expect(link.dismiss).toHaveBeenCalled()
    expect(link.create).toHaveBeenCalled()
    expect(membershipService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_type: "admin",
        actor_id: "user_123",
        action: "customer.membership_level.recalculated_by_admin",
        metadata: expect.objectContaining({
          yearly_spent: 6000,
          matched_threshold: 5000,
          reason: "manual_recalculation",
        }),
      })
    )
  })

  it("does not fail or create an audit log when the resolved level does not change", async () => {
    retrieveCustomerWithMembershipLevelMock.mockResolvedValue({
      ...currentCustomer,
      membership_member_level: {
        id: "level_silver",
        name: "銀卡會員",
        sort_order: 20,
        reward_rate: 2,
        birthday_reward_rate: 2,
        upgrade_gift_points: 100,
        upgrade_threshold: 5000,
        auto_upgrade: true,
        can_join_event: true,
        is_active: true,
      },
    } as never)

    query.graph.mockResolvedValue({
      data: [
        {
          id: "ord_first",
          customer_id: "cus_123",
          total: 1000,
          currency_code: "TWD",
          created_at: "2022-03-15T00:00:00.000Z",
          status: "completed",
        },
        {
          id: "ord_current_cycle",
          customer_id: "cus_123",
          total: 6000,
          currency_code: "TWD",
          created_at: "2026-03-20T00:00:00.000Z",
          status: "completed",
        },
      ],
    })

    const result = await recalculateCustomerMembershipLevel(scope, {
      customerId: "cus_123",
      actorType: "system",
      actorId: "system",
      reason: "workflow_recalculation",
    })

    expect(result.changed).toBe(false)
    expect(link.dismiss).not.toHaveBeenCalled()
    expect(link.create).not.toHaveBeenCalled()
    expect(membershipService.createAuditLog).not.toHaveBeenCalled()
  })
})
