import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  getMembershipService,
} from "../../../helpers"
import type {
  AdminMembershipCustomerPointsResponse,
  PointLogRecord,
} from "../../../types"
import type { AdminGetMembershipCustomerPointsParamsType } from "../../../validators"

export async function GET(
  req: AuthenticatedMedusaRequest<
    unknown,
    AdminGetMembershipCustomerPointsParamsType
  >,
  res: MedusaResponse<AdminMembershipCustomerPointsResponse>
): Promise<void> {
  await ensureMembershipCustomer(req.scope, req.params.id)

  const membershipService = getMembershipService(req.scope)
  const { balance, available_balance, summary, logs } =
    await membershipService.getCustomerPoints(
    req.params.id
    )
  const { limit, offset } = req.validatedQuery
  const paginatedLogs = logs.slice(offset, offset + limit) as PointLogRecord[]

  res.json({
    balance,
    available_balance: available_balance,
    points_summary: {
      total_points: summary.total_points,
      available_points: summary.available_points,
      expired_points: summary.expired_points,
      redeemed_points: summary.redeemed_points,
      refunded_points: summary.refunded_points,
    },
    logs: paginatedLogs,
    count: logs.length,
    offset,
    limit,
  })
}
