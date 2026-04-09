import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { GraphResultSet } from "@medusajs/types"
import { MEMBERSHIP_MODULE } from "../modules/membership"
import type MembershipModuleService from "../modules/membership/service"
import { autoUpgradeLevelWorkflow } from "../workflows/membership/auto-upgrade-level"

type OrderCompletedEventData = {
  id?: string
}

type OrderGraph = GraphResultSet<"order">["data"][number] & {
  id: string
  customer_id?: string | null
  total?: number | string | null
}

export default async function orderCompletedAddPointsHandler({
  event,
  container,
}: SubscriberArgs<OrderCompletedEventData>): Promise<void> {
  const orderId = event.data.id

  if (!orderId) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "total"],
    filters: {
      id: orderId,
    },
  })

  const order = data[0] as OrderGraph | undefined

  if (!order?.customer_id) {
    return
  }

  const points = Math.floor(Number(order.total ?? 0) / 100)

  if (points <= 0) {
    return
  }

  const membershipService =
    container.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)

  await membershipService.adjustPoints(
    order.customer_id,
    points,
    "order",
    order.id,
    `Order ${order.id} completed points awarded`
  )

  await autoUpgradeLevelWorkflow(container).run({
    input: {
      customer_id: order.customer_id,
      reason: `order_completed:${order.id}`,
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.completed",
}
