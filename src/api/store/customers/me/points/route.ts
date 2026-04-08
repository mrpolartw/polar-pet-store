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
  const { balance, logs } = await membershipService.getCustomerPoints(customerId)
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
