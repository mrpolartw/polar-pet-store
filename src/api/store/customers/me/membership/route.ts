import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  getCustomerId,
  getMembershipService,
  retrieveCustomerMembership,
} from "../../../membership/helpers"
import { retrieveCustomerMembershipLevelComputation } from "../../../../../lib/membership/customer-membership-level"
import { buildCustomerMembershipProgress } from "../../../../../lib/membership/customer-membership-progress"
import { normalizeMembershipHistoryItem } from "../../../../../lib/membership/customer-membership-history"
import type { StoreCustomerMembershipResponse } from "../../../membership/types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerMembershipResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const customer = await retrieveCustomerMembership(req.scope, customerId)

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${customerId} was not found`
    )
  }

  const [points, computation, auditLogs, levels] = await Promise.all([
    membershipService.getCustomerPoints(customerId),
    retrieveCustomerMembershipLevelComputation(req.scope, customerId),
    membershipService.listAuditLogs(
      {
        target_type: "customer",
        target_id: customerId,
      },
      {
        order: {
          created_at: "DESC",
          id: "DESC",
        },
        take: 10,
      }
    ),
    membershipService.listMemberLevels(
      {},
      {
        order: {
          upgrade_threshold: "ASC",
          sort_order: "ASC",
          id: "ASC",
        },
      }
    ),
  ])
  const progress = buildCustomerMembershipProgress({
    currentLevel: computation.current_level,
    yearlySpent: computation.yearly_spent,
    levels,
  })

  res.json({
    customer_id: customerId,
    current_level: computation.current_level,
    next_level: progress.next_level,
    points_balance: points.available_balance,
    available_points: points.available_balance,
    yearly_spent: computation.yearly_spent,
    total_spent: computation.total_spent,
    level_progress: progress.progress,
    points_summary: {
      total_points: points.summary.total_points,
      available_points: points.summary.available_points,
      expired_points: points.summary.expired_points,
      redeemed_points: points.summary.redeemed_points,
      refunded_points: points.summary.refunded_points,
    },
    recent_point_logs: points.logs.slice(0, 5),
    recent_history: auditLogs.map(normalizeMembershipHistoryItem),
  })
}
