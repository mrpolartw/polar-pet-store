import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { GET, PATCH } from "../route"
import {
  retrieveAdminCustomerMembershipDetail,
  updateAdminCustomerMembership,
} from "../../../../../../lib/membership/admin-customer-membership"

jest.mock("../../../../../../lib/membership/admin-customer-membership", () => ({
  retrieveAdminCustomerMembershipDetail: jest.fn(),
  updateAdminCustomerMembership: jest.fn(),
}))

const retrieveAdminCustomerMembershipDetailMock = jest.mocked(
  retrieveAdminCustomerMembershipDetail
)
const updateAdminCustomerMembershipMock = jest.mocked(
  updateAdminCustomerMembership
)

describe("admin customer membership route", () => {
  const membership = {
    customer_id: "cus_123",
    phone: "0911222333",
    birthday: "1990-05-01",
    gender: "female" as const,
    last_login_at: null,
    summary: {
      points: 100,
      total_points: 130,
      available_points: 100,
      expired_points: 20,
      redeemed_points: 5,
      refunded_points: 5,
      total_spent: 2000,
      yearly_spent: 1200,
      currency_code: "TWD",
      joined_at: "2025-01-02T03:04:05.000Z",
      current_level: {
        id: "level_vip",
        name: "VIP",
        sort_order: 20,
        reward_rate: 2,
        birthday_reward_rate: 3,
        upgrade_gift_points: 500,
        upgrade_threshold: 10000,
        auto_upgrade: true,
        can_join_event: true,
      },
    },
  }

  function createResponse() {
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()

    return {
      status,
      json,
    } as unknown as MedusaResponse
  }

  beforeEach(() => {
    retrieveAdminCustomerMembershipDetailMock.mockResolvedValue(membership)
    updateAdminCustomerMembershipMock.mockResolvedValue(membership)
  })

  it("returns membership detail on GET", async () => {
    const req = {
      scope: {},
      params: {
        id: "cus_123",
      },
    } as unknown as AuthenticatedMedusaRequest
    const res = createResponse()

    await GET(req, res)

    expect(retrieveAdminCustomerMembershipDetailMock).toHaveBeenCalledWith(
      req.scope,
      "cus_123"
    )
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200)
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({
      membership,
    })
  })

  it("updates membership detail on PATCH", async () => {
    const req = {
      scope: {},
      params: {
        id: "cus_123",
      },
      auth_context: {
        actor_id: "user_123",
      },
      ip: "127.0.0.1",
      validatedBody: {
        phone: "0922333444",
        birthday: "1992-06-15",
        gender: "male",
      },
    } as unknown as AuthenticatedMedusaRequest & {
      validatedBody: {
        phone: string
        birthday: string
        gender: "male"
      }
    }
    const res = createResponse()

    await PATCH(req, res)

    expect(updateAdminCustomerMembershipMock).toHaveBeenCalledWith(req.scope, {
      customerId: "cus_123",
      actorId: "user_123",
      ipAddress: "127.0.0.1",
      payload: req.validatedBody,
    })
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200)
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({
      membership,
    })
  })
})
