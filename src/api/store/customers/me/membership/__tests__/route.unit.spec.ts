import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { GET } from "../route"
import {
  getMembershipService,
  retrieveCustomerMembership,
} from "../../../../membership/helpers"
import { retrieveCustomerMembershipLevelComputation } from "../../../../../../lib/membership/customer-membership-level"

jest.mock("../../../../membership/helpers", () => ({
  getCustomerId: jest.fn(() => "cus_123"),
  getMembershipService: jest.fn(),
  retrieveCustomerMembership: jest.fn(),
}))

jest.mock(
  "../../../../../../lib/membership/customer-membership-level",
  () => ({
    retrieveCustomerMembershipLevelComputation: jest.fn(),
  })
)

const getMembershipServiceMock = jest.mocked(getMembershipService)
const retrieveCustomerMembershipMock = jest.mocked(retrieveCustomerMembership)
const retrieveCustomerMembershipLevelComputationMock = jest.mocked(
  retrieveCustomerMembershipLevelComputation
)

describe("store customer membership route", () => {
  function createResponse() {
    const json = jest.fn()

    return {
      json,
    } as unknown as MedusaResponse
  }

  beforeEach(() => {
    retrieveCustomerMembershipMock.mockResolvedValue({
      id: "cus_123",
    } as never)
    getMembershipServiceMock.mockReturnValue({
      getCustomerPoints: jest.fn(async () => ({
        balance: 130,
        available_balance: 100,
        summary: {
          total_points: 130,
          ledger_balance: 130,
          available_points: 100,
          expired_points: 20,
          pending_expired_points: 10,
          redeemed_points: 5,
          refunded_points: 5,
          expired_logged_points: 10,
          total_earned_points: 160,
          adjustment_points: 0,
          last_balance_after: 130,
          lots: [],
        },
        logs: [
          {
            id: "pl_1",
            customer_id: "cus_123",
            points: 30,
            balance_after: 130,
            source: "order",
            reference_id: "ord_123",
            note: "訂單回饋",
            expired_at: "2027-04-09T12:00:00.000Z",
            metadata: null,
            created_at: "2026-04-09T12:00:00.000Z",
          },
        ],
      })),
    } as never)
    retrieveCustomerMembershipLevelComputationMock.mockResolvedValue({
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
    } as never)
  })

  it("returns the new point summary fields and recent point logs", async () => {
    const req = {
      scope: {},
      auth_context: {
        actor_id: "cus_123",
      },
    } as unknown as AuthenticatedMedusaRequest
    const res = createResponse()

    await GET(req, res)

    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({
      customer_id: "cus_123",
      current_level: expect.objectContaining({
        id: "level_silver",
      }),
      points_balance: 100,
      available_points: 100,
      points_summary: {
        total_points: 130,
        available_points: 100,
        expired_points: 20,
        redeemed_points: 5,
        refunded_points: 5,
      },
      recent_point_logs: [
        expect.objectContaining({
          id: "pl_1",
          source: "order",
        }),
      ],
    })
  })
})
