import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { POST } from "../route"
import { recalculateCustomerMembershipLevel } from "../../../../../../../lib/membership/customer-membership-level"

jest.mock(
  "../../../../../../../lib/membership/customer-membership-level",
  () => ({
    recalculateCustomerMembershipLevel: jest.fn(),
  })
)

const recalculateCustomerMembershipLevelMock = jest.mocked(
  recalculateCustomerMembershipLevel
)

describe("admin customer membership recalculate route", () => {
  function createResponse() {
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()

    return {
      status,
      json,
    } as unknown as MedusaResponse
  }

  it("recalculates the customer level through the admin action", async () => {
    recalculateCustomerMembershipLevelMock.mockResolvedValue({
      customer_id: "cus_123",
      previous_level: null,
      current_level: {
        id: "level_family",
        name: "家庭會員",
        sort_order: 10,
        reward_rate: 1,
        birthday_reward_rate: 1,
        upgrade_gift_points: 0,
        upgrade_threshold: 0,
        auto_upgrade: true,
        can_join_event: false,
      },
      changed: true,
      yearly_spent: 0,
      total_spent: 0,
      currency_code: "TWD",
      first_order_at: null,
      cycle_start: null,
      matched_threshold: 0,
      used_fallback_level: true,
    } as never)

    const req = {
      scope: {},
      params: {
        id: "cus_123",
      },
      auth_context: {
        actor_id: "user_123",
      },
      ip: "127.0.0.1",
    } as unknown as AuthenticatedMedusaRequest
    const res = createResponse()

    await POST(req, res)

    expect(recalculateCustomerMembershipLevelMock).toHaveBeenCalledWith(
      req.scope,
      expect.objectContaining({
        customerId: "cus_123",
        actorType: "admin",
        actorId: "user_123",
        ipAddress: "127.0.0.1",
      })
    )
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200)
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        customer_id: "cus_123",
        changed: true,
      })
    )
  })
})
