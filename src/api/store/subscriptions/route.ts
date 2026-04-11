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
  const subscriptions = (await membershipService.listSubscriptions(
    { customer_id: customerId },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )) as SubscriptionRecord[]
  const activeSubscription =
    subscriptions.find((subscription) => subscription.status === "active") ??
    null
  const latestSubscription = subscriptions[0] ?? null

  res.json({
    subscription: activeSubscription,
    subscriptions,
    active_subscription: activeSubscription,
    latest_subscription: latestSubscription,
    count: subscriptions.length,
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

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.subscription.created",
    target_type: "customer",
    target_id: customerId,
    after_state: {
      subscription_id: subscription.id,
      status: subscription.status,
      plan_name: subscription.plan_name,
    },
  })

  res.status(200).json({
    subscription,
  })
}
