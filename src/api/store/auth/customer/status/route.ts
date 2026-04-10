import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { retrieveCustomerAuthStatus } from "../../../customer-auth/helpers"
import type { StoreCustomerAuthStatusResponse } from "../../../customer-auth/types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerAuthStatusResponse>
): Promise<void> {
  const customerId = req.auth_context.actor_id
  const status = await retrieveCustomerAuthStatus(req.scope, customerId)

  res.json(status)
}
