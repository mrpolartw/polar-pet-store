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
        sort_order: customer.membership_member_level.sort_order,
        reward_rate: customer.membership_member_level.reward_rate,
        birthday_reward_rate:
          customer.membership_member_level.birthday_reward_rate,
        upgrade_gift_points:
          customer.membership_member_level.upgrade_gift_points,
        upgrade_threshold: customer.membership_member_level.upgrade_threshold,
        auto_upgrade: customer.membership_member_level.auto_upgrade,
        can_join_event: customer.membership_member_level.can_join_event,
      }
    : null

  res.json({
    customer_id: customerId,
    current_level: currentLevel,
    points_balance: balance,
  })
}
