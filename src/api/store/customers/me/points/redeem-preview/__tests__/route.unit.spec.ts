import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { POST } from "../route"
import { getMembershipService } from "../../../../../membership/helpers"
import type { StorePreviewMembershipPointRedemptionType } from "../../../../../membership/validators"

jest.mock("../../../../../membership/helpers", () => ({
  getCustomerId: jest.fn(() => "cus_123"),
  getMembershipService: jest.fn(),
}))

const getMembershipServiceMock = jest.mocked(getMembershipService)

describe("store point redemption preview route", () => {
  function createResponse() {
    const json = jest.fn()

    return {
      json,
    } as unknown as MedusaResponse
  }

  beforeEach(() => {
    getMembershipServiceMock.mockReturnValue({
      getCustomerPoints: jest.fn(async () => ({
        balance: 130,
        available_balance: 80,
        summary: {
          total_points: 130,
          ledger_balance: 130,
          available_points: 80,
          expired_points: 20,
          pending_expired_points: 0,
          redeemed_points: 10,
          refunded_points: 0,
          expired_logged_points: 20,
          total_earned_points: 160,
          adjustment_points: 0,
          last_balance_after: 130,
          lots: [],
        },
        logs: [],
      })),
    } as never)
  })

  it("returns a validated preview payload", async () => {
    const req = {
      scope: {},
      auth_context: {
        actor_id: "cus_123",
      },
      validatedBody: {
        points: 50,
        order_subtotal: 120,
      },
    } as unknown as AuthenticatedMedusaRequest<
      StorePreviewMembershipPointRedemptionType
    >
    const res = createResponse()

    await POST(req, res)

    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({
      preview: {
        customer_id: "cus_123",
        requested_points: 50,
        available_points: 80,
        max_redeemable_points: 80,
        redeemable_points: 50,
        redemption_amount: 50,
        order_subtotal: 120,
        remaining_amount: 70,
        is_valid: true,
        validation_message: null,
      },
    })
  })
})
