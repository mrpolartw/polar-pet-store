import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { processOrderRefundMembershipEffects } from "../../../../../../lib/membership/membership-point-effects"
import type { AdminProcessMembershipOrderRefundType } from "../../../validators"

type AdminMembershipOrderRefundResponse = {
  refund: NonNullable<
    Awaited<ReturnType<typeof processOrderRefundMembershipEffects>>
  >
}

export async function POST(
  req: AuthenticatedMedusaRequest<AdminProcessMembershipOrderRefundType>,
  res: MedusaResponse<AdminMembershipOrderRefundResponse>
): Promise<void> {
  const refund = await processOrderRefundMembershipEffects(req.scope, {
    orderId: req.params.id,
    referenceId: req.validatedBody.reference_id,
    originalRefundAmount: req.validatedBody.refund_amount,
    actorType: "admin",
    actorId: req.auth_context.actor_id,
    note: req.validatedBody.note,
  })

  if (!refund) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id: ${req.params.id} was not found or has no membership customer`
    )
  }

  res.json({ refund })
}
