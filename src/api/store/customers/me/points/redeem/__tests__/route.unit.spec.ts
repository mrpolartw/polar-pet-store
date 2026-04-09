import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { POST } from "../route"
import { getMembershipService } from "../../../../../membership/helpers"
import { applyMembershipPointRedemption } from "../../../../../../../lib/membership/membership-point-effects"
import type { StoreApplyMembershipPointRedemptionType } from "../../../../../membership/validators"

jest.mock("../../../../../membership/helpers", () => ({
  getCustomerId: jest.fn(() => "cus_123"),
  getMembershipService: jest.fn(),
}))

jest.mock("../../../../../../../lib/membership/membership-point-effects", () => ({
  applyMembershipPointRedemption: jest.fn(),
}))

const getMembershipServiceMock = jest.mocked(getMembershipService)
const applyMembershipPointRedemptionMock = jest.mocked(
  applyMembershipPointRedemption
)

describe("store point redemption route", () => {
  function createResponse() {
    const json = jest.fn()

    return {
      json,
    } as unknown as MedusaResponse
  }

  beforeEach(() => {
    jest.clearAllMocks()

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

    applyMembershipPointRedemptionMock.mockResolvedValue({
      customer_id: "cus_123",
      reference_id: "order:ord_123",
      redeemed_points: 60,
      redemption_amount: 60,
      created: true,
      point_log_id: "pl_123",
      available_points_before: 80,
      available_points_after: 20,
    })
  })

  it("applies a validated redemption", async () => {
    const req = {
      scope: {},
      auth_context: {
        actor_id: "cus_123",
      },
      validatedBody: {
        points: 60,
        order_subtotal: 120,
        reference_id: "order:ord_123",
      },
    } as unknown as AuthenticatedMedusaRequest<
      StoreApplyMembershipPointRedemptionType
    >
    const res = createResponse()

    await POST(req, res)

    expect(applyMembershipPointRedemptionMock).toHaveBeenCalledWith(
      req.scope,
      expect.objectContaining({
        customerId: "cus_123",
        referenceId: "order:ord_123",
        points: 60,
      })
    )

    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({
      redemption: {
        customer_id: "cus_123",
        reference_id: "order:ord_123",
        requested_points: 60,
        available_points: 80,
        max_redeemable_points: 80,
        redeemable_points: 60,
        redemption_amount: 60,
        order_subtotal: 120,
        remaining_amount: 60,
        is_valid: true,
        validation_message: null,
        created: true,
        point_log_id: "pl_123",
        available_points_before: 80,
        available_points_after: 20,
      },
    })
  })

  it("rejects over-limit redemptions before applying points", async () => {
    const req = {
      scope: {},
      auth_context: {
        actor_id: "cus_123",
      },
      validatedBody: {
        points: 120,
        order_subtotal: 120,
        reference_id: "order:ord_999",
      },
    } as unknown as AuthenticatedMedusaRequest<
      StoreApplyMembershipPointRedemptionType
    >
    const res = createResponse()

    await expect(POST(req, res)).rejects.toThrow(MedusaError)
    expect(applyMembershipPointRedemptionMock).not.toHaveBeenCalled()
  })
})
