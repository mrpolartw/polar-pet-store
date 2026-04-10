import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listStorefrontOrdersByPhone } from "../../../lib/storefront/storefront-orders"
import type { StoreListOrdersResponse } from "../orders/types"
import type { StoreLookupOrdersByPhoneType } from "../orders/validators"

export async function GET(
  req: MedusaRequest<StoreLookupOrdersByPhoneType>,
  res: MedusaResponse<StoreListOrdersResponse>
): Promise<void> {
  const query = req.validatedQuery as StoreLookupOrdersByPhoneType
  const orders = await listStorefrontOrdersByPhone(
    req.scope,
    query.phone,
    query.limit
  )

  res.json({
    orders,
    count: orders.length,
    offset: query.offset,
    limit: query.limit,
  })
}
