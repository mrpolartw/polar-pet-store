import type {
  AuthenticatedMedusaRequest,
} from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import type MembershipModuleService from "../../../modules/membership/service"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import {
  listAdminCustomerMembershipList,
} from "../../../lib/membership/admin-customer-membership-list"
import {
  retrieveCustomerWithMembershipLevel,
} from "../../../lib/membership/customer-membership"
import type {
  AdminCustomerMembershipListItem,
} from "../../../lib/membership/customer-membership-list"
import type {
  AuditLogRecord,
  CustomerMembershipGraph,
  MemberLevelSummary,
  MembershipLevelRecord,
} from "./types"

export const memberLevelFields = [
  "id",
  "name",
  "sort_order",
  "reward_rate",
  "birthday_reward_rate",
  "upgrade_gift_points",
  "upgrade_threshold",
  "auto_upgrade",
  "can_join_event",
  "is_active",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const auditLogFields = [
  "id",
  "actor_type",
  "actor_id",
  "action",
  "target_type",
  "target_id",
  "before_state",
  "after_state",
  "ip_address",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
]

export function getAdminUserId(req: AuthenticatedMedusaRequest): string {
  return req.auth_context.actor_id
}

export function getMembershipService(
  scope: MedusaContainer
): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

export async function listMembershipCustomers(
  scope: MedusaContainer,
  filters: Record<string, unknown>,
  pagination: {
    skip: number
    take?: number
    order?: Record<string, string>
  }
): Promise<{
  customers: AdminCustomerMembershipListItem[]
  metadata: {
    count: number
    skip: number
    take: number
  }
}> {
  return await listAdminCustomerMembershipList(scope, {
    filters,
    pagination,
  })
}

export async function refetchMembershipCustomer(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerMembershipGraph | null> {
  return (await retrieveCustomerWithMembershipLevel(
    scope,
    customerId
  )) as CustomerMembershipGraph | null
}

export async function ensureMembershipCustomer(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerMembershipGraph> {
  const customer = await refetchMembershipCustomer(scope, customerId)

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${customerId} was not found`
    )
  }

  return customer
}

export async function ensureMemberLevel(
  scope: MedusaContainer,
  memberLevelId: string
): Promise<MembershipLevelRecord> {
  const membershipService = getMembershipService(scope)
  const [memberLevel] = (await membershipService.listMemberLevels(
    {
      id: memberLevelId,
    },
    {
      take: 1,
    }
  )) as MembershipLevelRecord[]

  if (!memberLevel) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Member level with id: ${memberLevelId} was not found`
    )
  }

  return memberLevel
}

export async function listCustomerAuditLogs(
  scope: MedusaContainer,
  customerId: string,
  pagination: {
    skip: number
    take?: number
    order?: Record<string, string>
  },
  filters?: Record<string, unknown>
): Promise<{
  audit_logs: AuditLogRecord[]
  metadata: {
    count: number
    skip: number
    take: number
  }
}> {
  const membershipService = getMembershipService(scope)
  const selector = {
    target_type: "customer",
    target_id: customerId,
    ...(filters ?? {}),
  }
  const order = pagination.order ?? {
    created_at: "DESC",
    id: "DESC",
  }
  const [auditLogs, allAuditLogs] = await Promise.all([
    membershipService.listAuditLogs(selector, {
      ...pagination,
      order,
    }),
    membershipService.listAuditLogs(selector, {
      order,
    }),
  ])

  return {
    audit_logs: auditLogs as AuditLogRecord[],
    metadata: {
      count: allAuditLogs.length,
      skip: pagination.skip,
      take: pagination.take ?? auditLogs.length,
    },
  }
}

export function summarizeMemberLevel(
  level: MembershipLevelRecord | null | undefined
): MemberLevelSummary | null {
  if (!level) {
    return null
  }

  return {
    id: level.id,
    name: level.name,
    sort_order: level.sort_order,
    reward_rate: level.reward_rate,
    birthday_reward_rate: level.birthday_reward_rate,
    upgrade_gift_points: level.upgrade_gift_points,
    upgrade_threshold: level.upgrade_threshold,
    auto_upgrade: level.auto_upgrade,
    can_join_event: level.can_join_event,
  }
}
