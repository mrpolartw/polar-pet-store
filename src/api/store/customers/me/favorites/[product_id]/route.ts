import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getCustomerId, getMembershipService } from "../../../../membership/helpers"
import type { StoreDeletedResponse } from "../../../../membership/types"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreDeletedResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)

  await membershipService.removeFavorite(customerId, req.params.product_id)

  res.status(200).json({
    id: req.params.product_id,
    object: "favorite",
    deleted: true,
  })
}
