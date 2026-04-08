import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  getMembershipService,
} from "../../../helpers"
import type {
  AdminMembershipCustomerSubscriptionResponse,
  SubscriptionRecord,
} from "../../../types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminMembershipCustomerSubscriptionResponse>
): Promise<void> {
  await ensureMembershipCustomer(req.scope, req.params.id)

  const membershipService = getMembershipService(req.scope)
  const subscription = (await membershipService.getActiveSubscription(
    req.params.id
  )) as SubscriptionRecord | null

  res.json({
    subscription,
  })
}
