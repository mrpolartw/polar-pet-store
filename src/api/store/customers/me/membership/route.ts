import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  getCustomerId,
  getMembershipService,
  retrieveCustomerMembership,
} from "../../../membership/helpers"
import { retrieveCustomerMembershipLevelComputation } from "../../../../../lib/membership/customer-membership-level"
import type { StoreCustomerMembershipResponse } from "../../../membership/types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerMembershipResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const customer = await retrieveCustomerMembership(req.scope, customerId)

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${customerId} was not found`
    )
  }

  const [points, computation] = await Promise.all([
    membershipService.getCustomerPoints(customerId),
    retrieveCustomerMembershipLevelComputation(req.scope, customerId),
  ])

  res.json({
    customer_id: customerId,
    current_level: computation.current_level,
    points_balance: points.available_balance,
    available_points: points.available_balance,
    yearly_spent: computation.yearly_spent,
    total_spent: computation.total_spent,
    points_summary: {
      total_points: points.summary.total_points,
      available_points: points.summary.available_points,
      expired_points: points.summary.expired_points,
      redeemed_points: points.summary.redeemed_points,
      refunded_points: points.summary.refunded_points,
    },
    recent_point_logs: points.logs.slice(0, 5),
  })
}
