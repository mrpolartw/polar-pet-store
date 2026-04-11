import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getCustomerId, getMembershipService } from "../../../../membership/helpers"
import { normalizeMembershipHistoryItem } from "../../../../../../lib/membership/customer-membership-history"
import type { StoreCustomerMembershipHistoryResponse } from "../../../../membership/types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerMembershipHistoryResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const items = await membershipService.listAuditLogs(
    {
      target_type: "customer",
      target_id: customerId,
    },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
      take: 20,
    }
  )

  res.json({
    items: items.map(normalizeMembershipHistoryItem),
    count: items.length,
  })
}
