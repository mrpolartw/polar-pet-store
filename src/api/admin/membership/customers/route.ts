import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { listMembershipCustomers } from "../helpers"
import type { AdminMembershipCustomersResponse } from "../types"
import type { AdminGetMembershipCustomersParamsType } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest<unknown, AdminGetMembershipCustomersParamsType>,
  res: MedusaResponse<AdminMembershipCustomersResponse>
): Promise<void> {
  const { customers, metadata } = await listMembershipCustomers(
    req.scope,
    req.filterableFields as Record<string, unknown>,
    req.queryConfig.pagination
  )

  res.json({
    customers,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
