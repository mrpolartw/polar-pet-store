import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getCustomerId,
  getMembershipService,
  normalizeCreateSubscriptionPayload,
} from "../membership/helpers"
import type {
  StoreCustomerSubscriptionResponse,
  StoreCustomerSubscriptionsResponse,
  SubscriptionRecord,
} from "../membership/types"
import type { StoreCreateSubscriptionType } from "../membership/validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerSubscriptionsResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const subscription = (await membershipService.getActiveSubscription(
    customerId
  )) as SubscriptionRecord | null

  res.json({
    subscription,
    count: subscription ? 1 : 0,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreateSubscriptionType>,
  res: MedusaResponse<StoreCustomerSubscriptionResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const subscription = (await membershipService.createSubscription(
    customerId,
    normalizeCreateSubscriptionPayload(req.validatedBody)
  )) as SubscriptionRecord

  res.status(200).json({
    subscription,
  })
}
