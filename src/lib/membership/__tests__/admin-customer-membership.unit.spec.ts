import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import {
  retrieveAdminCustomerMembershipDetail,
  updateAdminCustomerMembership,
} from "../admin-customer-membership"
import { retrieveCustomerWithMembershipLevel } from "../customer-membership"

jest.mock("../customer-membership", () => ({
  retrieveCustomerWithMembershipLevel: jest.fn(),
}))

const retrieveCustomerWithMembershipLevelMock = jest.mocked(
  retrieveCustomerWithMembershipLevel
)

describe("admin customer membership helper", () => {
  let currentCustomer: Record<string, unknown>
  let currentProfile: Record<string, unknown> | null
  let membershipService: Record<string, jest.Mock>
  let customerService: Record<string, jest.Mock>
  let queryService: Record<string, jest.Mock>
  let scope: MedusaContainer

  beforeEach(() => {
    const now = new Date()
    const currentYearOrderDate = new Date(
      now.getFullYear(),
      2,
      1
    ).toISOString()
    const lastYearOrderDate = new Date(
      now.getFullYear() - 1,
      5,
      1
    ).toISOString()

    currentCustomer = {
      id: "cus_123",
      email: "member@example.com",
      phone: "0911222333",
      created_at: "2025-01-02T03:04:05.000Z",
      membership_member_level: {
        id: "level_vip",
        name: "VIP",
        rank: 2,
        min_points: 100,
        discount_rate: 5,
        benefits: null,
      },
    }

    currentProfile = {
      id: "mcp_123",
      customer_id: "cus_123",
      birthday: new Date("1990-05-01T00:00:00.000Z"),
      gender: "female",
      last_login_at: new Date("2026-04-01T10:00:00.000Z"),
    }

    membershipService = {
      getCustomerProfile: jest.fn(async () => currentProfile),
      getCustomerPoints: jest.fn(async () => ({
        balance: 120,
        logs: [],
      })),
      upsertCustomerProfile: jest.fn(async (customerId, data) => {
        currentProfile = {
          ...(currentProfile ?? {
            id: "mcp_123",
            customer_id: customerId,
          }),
          ...data,
        }

        return currentProfile
      }),
      createAuditLog: jest.fn(async (payload) => payload),
    }

    customerService = {
      updateCustomers: jest.fn(async (_customerId, data) => {
        currentCustomer = {
          ...currentCustomer,
          phone: data.phone ?? null,
        }

        return currentCustomer
      }),
    }

    queryService = {
      graph: jest.fn(async () => ({
        data: [
          {
            id: "ord_current",
            total: 3000,
            currency_code: "TWD",
            created_at: currentYearOrderDate,
            status: "completed",
          },
          {
            id: "ord_previous",
            total: 1500,
            currency_code: "TWD",
            created_at: lastYearOrderDate,
            status: "archived",
          },
          {
            id: "ord_pending",
            total: 999,
            currency_code: "TWD",
            created_at: currentYearOrderDate,
            status: "pending",
          },
        ],
      })),
    }

    scope = {
      resolve: jest.fn((key: string) => {
        if (key === MEMBERSHIP_MODULE) {
          return membershipService
        }

        if (key === Modules.CUSTOMER) {
          return customerService
        }

        if (key === ContainerRegistrationKeys.QUERY) {
          return queryService
        }

        throw new Error(`Unexpected resolve key: ${key}`)
      }),
    } as unknown as MedusaContainer

    retrieveCustomerWithMembershipLevelMock.mockImplementation(
      async () => currentCustomer as never
    )
  })

  it("retrieves customer membership summary", async () => {
    const detail = await retrieveAdminCustomerMembershipDetail(scope, "cus_123")

    expect(detail.customer_id).toBe("cus_123")
    expect(detail.phone).toBe("0911222333")
    expect(detail.birthday).toBe("1990-05-01")
    expect(detail.gender).toBe("female")
    expect(detail.summary.points).toBe(120)
    expect(detail.summary.total_spent).toBe(4500)
    expect(detail.summary.yearly_spent).toBe(3000)
    expect(detail.summary.joined_at).toBe("2025-01-02T03:04:05.000Z")
    expect(detail.summary.current_level?.name).toBe("VIP")
  })

  it("updates phone, birthday, and gender while creating an audit log", async () => {
    const detail = await updateAdminCustomerMembership(scope, {
      customerId: "cus_123",
      actorId: "user_123",
      ipAddress: "127.0.0.1",
      payload: {
        phone: "0922333444",
        birthday: "1992-06-15",
        gender: "male",
      },
    })

    expect(customerService.updateCustomers).toHaveBeenCalledWith("cus_123", {
      phone: "0922333444",
    })
    expect(customerService.updateCustomers.mock.calls[0][1]).not.toHaveProperty(
      "email"
    )
    expect(membershipService.upsertCustomerProfile).toHaveBeenCalledWith(
      "cus_123",
      expect.objectContaining({
        gender: "male",
        birthday: expect.any(Date),
      })
    )
    expect(membershipService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: "user_123",
        action: "customer.membership_profile.updated",
        target_type: "customer",
        target_id: "cus_123",
        before_state: {
          phone: "0911222333",
          birthday: "1990-05-01",
          gender: "female",
        },
        after_state: {
          phone: "0922333444",
          birthday: "1992-06-15",
          gender: "male",
        },
      })
    )
    expect(detail.phone).toBe("0922333444")
    expect(detail.birthday).toBe("1992-06-15")
    expect(detail.gender).toBe("male")
  })
})
