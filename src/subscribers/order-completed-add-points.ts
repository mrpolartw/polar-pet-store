import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { processOrderCompletionMembershipEffects } from "../lib/membership/order-membership-effects"

type OrderCompletedEventData = {
  id?: string
}

export default async function orderCompletedAddPointsHandler({
  event,
  container,
}: SubscriberArgs<OrderCompletedEventData>): Promise<void> {
  const orderId = event.data.id

  if (!orderId) {
    return
  }
  await processOrderCompletionMembershipEffects(container as never, {
    orderId,
    actorType: "system",
    actorId: "system",
  })
}

export const config: SubscriberConfig = {
  event: "order.completed",
}
