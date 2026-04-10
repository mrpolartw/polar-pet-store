import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { getCustomerId, getMembershipService } from "../../../../membership/helpers"
import { applyMembershipPointRedemption } from "../../../../../../lib/membership/membership-point-effects"
import { validateMembershipPointRedemption } from "../../../../../../lib/membership/store-point-redemption"
import type {
  StoreCustomerPointRedemptionResponse,
} from "../../../../membership/types"
import type { StoreApplyMembershipPointRedemptionType } from "../../../../membership/validators"

export async function POST(
  req: AuthenticatedMedusaRequest<StoreApplyMembershipPointRedemptionType>,
  res: MedusaResponse<StoreCustomerPointRedemptionResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const pointState = await membershipService.getCustomerPoints(customerId)
  const validation = validateMembershipPointRedemption({
    availablePoints: pointState.summary.available_points,
    requestedPoints: req.validatedBody.points,
    orderSubtotal: req.validatedBody.order_subtotal,
  })

  if (!validation.is_valid || validation.redeemable_points <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      validation.validation_message ?? "點數折抵資料無效"
    )
  }

  const redemption = await applyMembershipPointRedemption(req.scope, {
    customerId,
    referenceId: req.validatedBody.reference_id,
    points: validation.redeemable_points,
    actorType: "customer",
    actorId: customerId,
    note:
      req.validatedBody.note ??
      `前台會員點數折抵 ${req.validatedBody.reference_id}`,
    metadata: {
      order_subtotal: validation.order_subtotal,
      requested_points: validation.requested_points,
      ...(req.validatedBody.metadata ?? {}),
    },
  })

  res.json({
    redemption: {
      customer_id: customerId,
      reference_id: redemption.reference_id,
      created: redemption.created,
      point_log_id: redemption.point_log_id,
      available_points_before: redemption.available_points_before,
      available_points_after: redemption.available_points_after,
      ...validation,
    },
  })
}
