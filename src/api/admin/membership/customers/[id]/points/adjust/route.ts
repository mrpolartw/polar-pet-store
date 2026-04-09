import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  getAdminUserId,
  getMembershipService,
} from "../../../../helpers"
import type {
  AdminAdjustMembershipPointsResponse,
  PointLogRecord,
} from "../../../../types"
import type { AdminAdjustMembershipPointsType } from "../../../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<AdminAdjustMembershipPointsType>,
  res: MedusaResponse<AdminAdjustMembershipPointsResponse>
): Promise<void> {
  const adminUserId = getAdminUserId(req)
  const membershipService = getMembershipService(req.scope)

  await ensureMembershipCustomer(req.scope, req.params.id)

  const { balance: previousBalance } = await membershipService.getCustomerPoints(
    req.params.id
  )
  const pointLog = (await membershipService.adjustPoints(
    req.params.id,
    req.validatedBody.delta,
    "admin",
    undefined,
    req.validatedBody.note ?? "admin adjust"
  )) as PointLogRecord

  await membershipService.createAuditLog({
    actor_type: "admin",
    actor_id: adminUserId,
    action: "ADJUST_POINTS",
    target_type: "customer",
    target_id: req.params.id,
    before_state: {
      balance: previousBalance,
    },
    after_state: {
      balance: pointLog.balance_after,
      delta: req.validatedBody.delta,
      point_log_id: pointLog.id,
    },
    metadata: {
      note: req.validatedBody.note ?? null,
    },
  })

  res.status(200).json({
    point_log: pointLog,
    balance: pointLog.balance_after,
  })
}
