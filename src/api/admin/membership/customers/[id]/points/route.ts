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
  const { balance, logs } = await membershipService.getCustomerPoints(
    req.params.id
  )
  const { limit, offset } = req.validatedQuery
  const paginatedLogs = logs.slice(offset, offset + limit) as PointLogRecord[]

  res.json({
    balance,
    logs: paginatedLogs,
    count: logs.length,
    offset,
    limit,
  })
}
