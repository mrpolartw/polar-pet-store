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
    points_balance: points.balance,
  })
}
