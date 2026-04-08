import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  listCustomerAuditLogs,
} from "../../../helpers"
import type { AdminMembershipCustomerAuditLogsResponse } from "../../../types"
import type {
  AdminGetMembershipCustomerAuditLogsParamsType,
} from "../../../validators"

export async function GET(
  req: AuthenticatedMedusaRequest<
    unknown,
    AdminGetMembershipCustomerAuditLogsParamsType
  >,
  res: MedusaResponse<AdminMembershipCustomerAuditLogsResponse>
): Promise<void> {
  await ensureMembershipCustomer(req.scope, req.params.id)

  const { audit_logs, metadata } = await listCustomerAuditLogs(
    req.scope,
    req.params.id,
    {
      ...req.queryConfig.pagination,
      order: req.queryConfig.pagination.order ?? {
        created_at: "DESC",
        id: "DESC",
      },
    },
    {
      ...(req.filterableFields.action
        ? { action: req.filterableFields.action }
        : {}),
    }
  )

  res.json({
    audit_logs,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
