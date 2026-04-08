import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  getMembershipService,
  summarizeMemberLevel,
} from "../../helpers"
import type {
  AdminMembershipCustomerResponse,
  FavoriteRecord,
  PetRecord,
  SubscriptionRecord,
} from "../../types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminMembershipCustomerResponse>
): Promise<void> {
  const membershipService = getMembershipService(req.scope)
  const customer = await ensureMembershipCustomer(req.scope, req.params.id)
  const { balance } = await membershipService.getCustomerPoints(req.params.id)
  const favorites = (await membershipService.listFavorites(
    { customer_id: req.params.id }
  )) as FavoriteRecord[]
  const pets = (await membershipService.listPets(
    { customer_id: req.params.id }
  )) as PetRecord[]
  const activeSubscription = (await membershipService.getActiveSubscription(
    req.params.id
  )) as SubscriptionRecord | null

  res.status(200).json({
    customer,
    current_level: summarizeMemberLevel(customer.membership_member_level),
    points_balance: balance,
    favorites_count: favorites.length,
    pets_count: pets.length,
    active_subscription: activeSubscription,
  })
}
