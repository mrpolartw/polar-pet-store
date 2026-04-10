import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createStorefrontOrder } from "../../../lib/storefront/storefront-orders"
import type { StoreCreateOrderResponse } from "./types"
import type { StoreCreateOrderType } from "./validators"

type StoreCreateOrderRequest = MedusaRequest<StoreCreateOrderType> & {
  auth_context?: {
    actor_id?: string
  }
}

export async function POST(
  req: StoreCreateOrderRequest,
  res: MedusaResponse<StoreCreateOrderResponse>
): Promise<void> {
  const order = await createStorefrontOrder(req.scope, {
    ...req.validatedBody,
    customerId: req.auth_context?.actor_id ?? null,
  })

  res.status(200).json({ order })
}
