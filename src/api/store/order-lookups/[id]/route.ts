import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { retrieveStorefrontOrder } from "../../../../lib/storefront/storefront-orders"
import type { StoreCreateOrderResponse } from "../../orders/types"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse<StoreCreateOrderResponse>
): Promise<void> {
  const order = await retrieveStorefrontOrder(req.scope, req.params.id)

  if (!order) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id: ${req.params.id} was not found`
    )
  }

  res.json({ order })
}
