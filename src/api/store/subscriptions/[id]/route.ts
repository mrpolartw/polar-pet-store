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

  const existingSubscription = await ensureSubscriptionOwnership(
    req.scope,
    customerId,
    req.params.id
  )

  const subscription = (await membershipService.updateSubscription(
    req.params.id,
    normalizeUpdateSubscriptionPayload(req.validatedBody)
  )) as SubscriptionRecord

  const action =
    existingSubscription.status !== subscription.status &&
    subscription.status === "paused"
      ? "customer.subscription.paused"
      : existingSubscription.status !== subscription.status &&
          subscription.status === "active"
        ? "customer.subscription.resumed"
        : "customer.subscription.updated"

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action,
    target_type: "customer",
    target_id: customerId,
    before_state: {
      subscription_id: existingSubscription.id,
      status: existingSubscription.status,
      plan_name: existingSubscription.plan_name,
    },
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

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerSubscriptionResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)

  const existingSubscription = await ensureSubscriptionOwnership(
    req.scope,
    customerId,
    req.params.id
  )

  const subscription = (await membershipService.cancelSubscription(
    req.params.id
  )) as SubscriptionRecord

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.subscription.canceled",
    target_type: "customer",
    target_id: customerId,
    before_state: {
      subscription_id: existingSubscription.id,
      status: existingSubscription.status,
      plan_name: existingSubscription.plan_name,
    },
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
