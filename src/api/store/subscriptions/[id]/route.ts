import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureSubscriptionOwnership,
  getCustomerId,
  getMembershipService,
  normalizeUpdateSubscriptionPayload,
} from "../../membership/helpers"
import type {
  StoreCustomerSubscriptionResponse,
  SubscriptionRecord,
} from "../../membership/types"
import type { StoreUpdateSubscriptionType } from "../../membership/validators"

export async function PATCH(
  req: AuthenticatedMedusaRequest<StoreUpdateSubscriptionType>,
  res: MedusaResponse<StoreCustomerSubscriptionResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)

  await ensureSubscriptionOwnership(req.scope, customerId, req.params.id)

  const subscription = (await membershipService.updateSubscription(
    req.params.id,
    normalizeUpdateSubscriptionPayload(req.validatedBody)
  )) as SubscriptionRecord

  res.status(200).json({
    subscription,
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerSubscriptionResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)

  await ensureSubscriptionOwnership(req.scope, customerId, req.params.id)

  const subscription = (await membershipService.cancelSubscription(
    req.params.id
  )) as SubscriptionRecord

  res.status(200).json({
    subscription,
  })
}
