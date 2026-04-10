import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { listStorefrontOrdersForCustomer } from "../../../../../lib/storefront/storefront-orders"
import type { StoreListOrdersResponse } from "../../../orders/types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreListOrdersResponse>
): Promise<void> {
  const customerId = req.auth_context.actor_id
  const orders = await listStorefrontOrdersForCustomer(req.scope, customerId)

  res.json({
    orders,
    count: orders.length,
    offset: 0,
    limit: orders.length,
  })
}
