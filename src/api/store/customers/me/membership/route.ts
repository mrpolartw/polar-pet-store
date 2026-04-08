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

  const { balance } = await membershipService.getCustomerPoints(customerId)
  const currentLevel = customer.membership_member_level
    ? {
        id: customer.membership_member_level.id,
        name: customer.membership_member_level.name,
        rank: customer.membership_member_level.rank,
        min_points: customer.membership_member_level.min_points,
        discount_rate: customer.membership_member_level.discount_rate,
        benefits: customer.membership_member_level.benefits,
      }
    : null

  res.json({
    customer_id: customerId,
    current_level: currentLevel,
    points_balance: balance,
  })
}
