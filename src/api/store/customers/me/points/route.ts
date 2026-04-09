import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getCustomerId, getMembershipService } from "../../../membership/helpers"
import type {
  StoreCustomerPointsResponse,
  PointLogRecord,
} from "../../../membership/types"
import type { StoreGetCustomerPointsParamsType } from "../../../membership/validators"

export async function GET(
  req: AuthenticatedMedusaRequest<unknown, StoreGetCustomerPointsParamsType>,
  res: MedusaResponse<StoreCustomerPointsResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const { balance, available_balance, summary, logs } =
    await membershipService.getCustomerPoints(customerId)
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
