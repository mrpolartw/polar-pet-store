import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import { listAdminCustomerMembershipList } from "../admin-customer-membership-list"
import { listCustomersWithMembershipLevels } from "../customer-membership"

jest.mock("../customer-membership", () => ({
  listCustomersWithMembershipLevels: jest.fn(),
}))

const listCustomersWithMembershipLevelsMock = jest.mocked(
  listCustomersWithMembershipLevels
)

describe("admin customer membership list helper", () => {
  const membershipService = {
    listCustomerProfiles: jest.fn(),
    listOAuthLinks: jest.fn(),
  }

  const orderService = {
    listOrders: jest.fn(),
  }

  const scope = {
    resolve: jest.fn((key: unknown) => {
      if (key === Modules.ORDER || String(key) === String(Modules.ORDER)) {
        return orderService
      }

      return membershipService
    }),
  } as unknown as MedusaContainer

  beforeEach(() => {
    jest.clearAllMocks()

    listCustomersWithMembershipLevelsMock.mockResolvedValue({
      rows: [
        {
          id: "cus_123",
          company_name: null,
          first_name: "小明",
          last_name: "王",
          email: "member@example.com",
          phone: "0911222333",
          has_account: true,
          created_by: "user_123",
          created_at: "2025-01-02T03:04:05.000Z",
          updated_at: "2025-01-03T03:04:05.000Z",
          deleted_at: null,
          membership_member_level: {
            id: "level_gold",
            name: "Gold",
            sort_order: 30,
            reward_rate: 5,
            birthday_reward_rate: 8,
            upgrade_gift_points: 1200,
            upgrade_threshold: 50000,
            auto_upgrade: true,
            can_join_event: true,
          },
        },
      ],
      metadata: {
        count: 1,
        skip: 0,
        take: 20,
      },
    } as never)

    membershipService.listCustomerProfiles.mockResolvedValue([
      {
        id: "profile_123",
        customer_id: "cus_123",
        last_login_at: "2026-04-08T10:00:00.000Z",
      },
    ])
    membershipService.listOAuthLinks.mockResolvedValue([
      {
        id: "oauth_123",
        customer_id: "cus_123",
        provider: "line",
      },
    ])
    orderService.listOrders.mockResolvedValue([
      {
        id: "ord_old",
        customer_id: "cus_123",
        created_at: "2025-12-01T08:00:00.000Z",
      },
      {
        id: "ord_latest",
        customer_id: "cus_123",
        created_at: "2026-03-05T09:30:00.000Z",
      },
    ])
  })

  it("maps customer list rows with membership summary fields and activity metadata", async () => {
    const result = await listAdminCustomerMembershipList(scope, {
      filters: {
        q: "0911222333",
      },
      pagination: {
        skip: 0,
        take: 20,
      },
    })

    expect(listCustomersWithMembershipLevelsMock).toHaveBeenCalledWith(scope, {
      filters: {
        q: "0911222333",
      },
      pagination: {
        skip: 0,
        take: 20,
        order: {
          created_at: "DESC",
          id: "DESC",
        },
      },
    })
    expect(membershipService.listCustomerProfiles).toHaveBeenCalledWith({
      customer_id: ["cus_123"],
    })
    expect(membershipService.listOAuthLinks).toHaveBeenCalledWith({
      customer_id: ["cus_123"],
      provider: "line",
    })
    expect(orderService.listOrders).toHaveBeenCalledWith(
      {
        customer_id: ["cus_123"],
      },
      {
        order: {
          created_at: "DESC",
          id: "DESC",
        },
      }
    )
    expect(result.customers).toEqual([
      {
        id: "cus_123",
        company_name: null,
        first_name: "小明",
        last_name: "王",
        email: "member@example.com",
        phone: "0911222333",
        has_account: true,
        created_by: "user_123",
        created_at: "2025-01-02T03:04:05.000Z",
        updated_at: "2025-01-03T03:04:05.000Z",
        deleted_at: null,
        joined_at: "2025-01-02T03:04:05.000Z",
        last_login_at: "2026-04-08T10:00:00.000Z",
        last_ordered_at: "2026-03-05T09:30:00.000Z",
        line_binding_status: "bound",
        membership_member_level: {
          id: "level_gold",
          name: "Gold",
          sort_order: 30,
          reward_rate: 5,
          birthday_reward_rate: 8,
          upgrade_gift_points: 1200,
          upgrade_threshold: 50000,
          auto_upgrade: true,
          can_join_event: true,
        },
      },
    ])
    expect(result.metadata).toEqual({
      count: 1,
      skip: 0,
      take: 20,
    })
  })
})
