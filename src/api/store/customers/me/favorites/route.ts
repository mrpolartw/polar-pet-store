import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getCustomerId, getMembershipService } from "../../../membership/helpers"
import type {
  FavoriteRecord,
  StoreCustomerFavoriteResponse,
  StoreCustomerFavoritesResponse,
} from "../../../membership/types"
import type { StoreAddFavoriteType } from "../../../membership/validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerFavoritesResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const items = (await membershipService.listFavorites(
    { customer_id: customerId },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )) as FavoriteRecord[]

  res.json({
    items,
    count: items.length,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreAddFavoriteType>,
  res: MedusaResponse<StoreCustomerFavoriteResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const favorite = (await membershipService.addFavorite(
    customerId,
    req.validatedBody.product_id,
    req.validatedBody.variant_id ?? undefined
  )) as FavoriteRecord

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.favorite.added",
    target_type: "customer",
    target_id: customerId,
    after_state: {
      product_id: favorite.product_id,
      variant_id: favorite.variant_id,
    },
  })

  res.status(200).json({
    favorite,
  })
}
