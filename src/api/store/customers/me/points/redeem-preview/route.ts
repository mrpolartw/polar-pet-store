import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getCustomerId, getMembershipService } from "../../../../membership/helpers"
import { validateMembershipPointRedemption } from "../../../../../../lib/membership/store-point-redemption"
import type {
  StoreCustomerPointRedemptionPreviewResponse,
} from "../../../../membership/types"
import type { StorePreviewMembershipPointRedemptionType } from "../../../../membership/validators"

export async function POST(
  req: AuthenticatedMedusaRequest<StorePreviewMembershipPointRedemptionType>,
  res: MedusaResponse<StoreCustomerPointRedemptionPreviewResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const pointState = await membershipService.getCustomerPoints(customerId)
  const preview = validateMembershipPointRedemption({
    availablePoints: pointState.summary.available_points,
    requestedPoints: req.validatedBody.points,
    orderSubtotal: req.validatedBody.order_subtotal,
  })

  res.json({
    preview: {
      customer_id: customerId,
      ...preview,
    },
  })
}
