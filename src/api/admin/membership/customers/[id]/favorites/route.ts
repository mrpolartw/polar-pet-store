import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  getMembershipService,
} from "../../../helpers"
import type {
  AdminMembershipCustomerFavoritesResponse,
  FavoriteRecord,
} from "../../../types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminMembershipCustomerFavoritesResponse>
): Promise<void> {
  await ensureMembershipCustomer(req.scope, req.params.id)

  const membershipService = getMembershipService(req.scope)
  const favorites = (await membershipService.listFavorites(
    { customer_id: req.params.id },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )) as FavoriteRecord[]

  res.json({
    favorites,
    count: favorites.length,
  })
}
