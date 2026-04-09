import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  getMembershipService,
} from "../../helpers"
import { retrieveCustomerMembershipLevelComputation } from "../../../../../lib/membership/customer-membership-level"
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
  const [points, favorites, pets, activeSubscription, computation] =
    await Promise.all([
      membershipService.getCustomerPoints(req.params.id),
      membershipService.listFavorites({
        customer_id: req.params.id,
      }) as Promise<FavoriteRecord[]>,
      membershipService.listPets({
        customer_id: req.params.id,
      }) as Promise<PetRecord[]>,
      membershipService.getActiveSubscription(
        req.params.id
      ) as Promise<SubscriptionRecord | null>,
      retrieveCustomerMembershipLevelComputation(req.scope, req.params.id),
    ])

  res.status(200).json({
    customer: {
      ...customer,
      membership_member_level: computation.resolved_level,
    },
    current_level: computation.current_level,
    points_balance: points.available_balance,
    available_points: points.available_balance,
    points_summary: {
      total_points: points.summary.total_points,
      available_points: points.summary.available_points,
      expired_points: points.summary.expired_points,
      redeemed_points: points.summary.redeemed_points,
      refunded_points: points.summary.refunded_points,
    },
    favorites_count: favorites.length,
    pets_count: pets.length,
    active_subscription: activeSubscription,
  })
}
