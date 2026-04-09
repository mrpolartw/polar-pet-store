import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getAdminUserId } from "../../../helpers"
import { recalculateCustomerMembershipLevel } from "../../../../../../lib/membership/customer-membership-level"
import type { AdminRecalculateMembershipLevelResponse } from "../../../types"

function getRequestIpAddress(req: AuthenticatedMedusaRequest): string | null {
  const requestWithIp = req as AuthenticatedMedusaRequest & { ip?: string }

  return requestWithIp.ip ?? null
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminRecalculateMembershipLevelResponse>
): Promise<void> {
  const result = await recalculateCustomerMembershipLevel(req.scope, {
    customerId: req.params.id,
    actorType: "admin",
    actorId: getAdminUserId(req),
    reason: "admin_customer_membership_management_widget",
    action: "customer.membership_level.recalculated_by_admin",
    ipAddress: getRequestIpAddress(req),
  })
  const { resolved_level: _resolvedLevel, ...response } = result

  res.status(200).json(response)
}
