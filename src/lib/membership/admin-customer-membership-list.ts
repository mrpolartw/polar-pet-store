import type {
  IOrderModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type MembershipModuleService from "../../modules/membership/service"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import { formatDateTimeString } from "./customer-membership-detail"
import {
  buildCustomerMembershipLevelMap,
  type CustomerMembershipLevelComputation,
  type CustomerMembershipOrderRecord,
} from "./customer-membership-level"
import type {
  AdminCustomerMembershipListItem,
  CustomerLineBindingStatus,
} from "./customer-membership-list"
import { listCustomersWithMembershipLevels } from "./customer-membership"

type CustomerMembershipRecord = Awaited<
  ReturnType<typeof listCustomersWithMembershipLevels>
>["rows"][number]
type MembershipCustomerProfileRecord = Awaited<
  ReturnType<MembershipModuleService["listCustomerProfiles"]>
>[number]
type MembershipOAuthLinkRecord = Awaited<
  ReturnType<MembershipModuleService["listOAuthLinks"]>
>[number]
type OrderRecord = Awaited<ReturnType<IOrderModuleService["listOrders"]>>[number] &
  CustomerMembershipOrderRecord

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getOrderService(scope: MedusaContainer): IOrderModuleService {
  return scope.resolve<IOrderModuleService>(Modules.ORDER)
}

function buildProfileMap(
  profiles: MembershipCustomerProfileRecord[]
): Map<string, MembershipCustomerProfileRecord> {
  return new Map(profiles.map((profile) => [profile.customer_id, profile]))
}

function buildLastOrderedAtMap(orders: OrderRecord[]): Map<string, string> {
  const lastOrderedAtByCustomerId = new Map<string, string>()

  for (const order of orders) {
    if (!order.customer_id || !order.created_at) {
      continue
    }

    const current = lastOrderedAtByCustomerId.get(order.customer_id)
    const nextValue = formatDateTimeString(order.created_at)

    if (!nextValue) {
      continue
    }

    if (!current || current < nextValue) {
      lastOrderedAtByCustomerId.set(order.customer_id, nextValue)
    }
  }

  return lastOrderedAtByCustomerId
}

function buildLineBindingStatusMap(
  oauthLinks: MembershipOAuthLinkRecord[]
): Map<string, CustomerLineBindingStatus> {
  const lineBindingStatusByCustomerId = new Map<string, CustomerLineBindingStatus>()

  for (const link of oauthLinks) {
    if (!link.customer_id) {
      continue
    }

    lineBindingStatusByCustomerId.set(link.customer_id, "bound")
  }

  return lineBindingStatusByCustomerId
}

function toAdminCustomerMembershipListItem(input: {
  customer: CustomerMembershipRecord
  profile: MembershipCustomerProfileRecord | null
  lastOrderedAt: string | null
  lineBindingStatus: CustomerLineBindingStatus | null
  currentLevel: CustomerMembershipLevelComputation["current_level"]
}): AdminCustomerMembershipListItem {
  return {
    id: input.customer.id,
    company_name: input.customer.company_name ?? null,
    first_name: input.customer.first_name ?? null,
    last_name: input.customer.last_name ?? null,
    email: input.customer.email ?? null,
    phone: input.customer.phone ?? null,
    has_account: input.customer.has_account ?? null,
    created_by: input.customer.created_by ?? null,
    created_at: formatDateTimeString(input.customer.created_at),
    updated_at: formatDateTimeString(input.customer.updated_at),
    deleted_at: formatDateTimeString(input.customer.deleted_at),
    joined_at: formatDateTimeString(input.customer.created_at),
    last_login_at: formatDateTimeString(input.profile?.last_login_at),
    last_ordered_at: input.lastOrderedAt,
    line_binding_status: input.lineBindingStatus,
    membership_member_level: input.currentLevel,
  }
}

export async function listAdminCustomerMembershipList(
  scope: MedusaContainer,
  input: {
    filters: Record<string, unknown>
    pagination: {
      skip: number
      take?: number
      order?: Record<string, string>
    }
  }
): Promise<{
  customers: AdminCustomerMembershipListItem[]
  metadata: {
    count: number
    skip: number
    take: number
  }
}> {
  const membershipService = getMembershipService(scope)
  const orderService = getOrderService(scope)
  const { rows, metadata } = await listCustomersWithMembershipLevels(scope, {
    filters: input.filters,
    pagination: {
      ...input.pagination,
      order: input.pagination.order ?? {
        created_at: "DESC",
        id: "DESC",
      },
    },
  })
  const customerIds = rows.map((customer) => customer.id)

  if (!customerIds.length) {
    return {
      customers: [],
      metadata,
    }
  }

  const [profiles, oauthLinks, orders, levels] = await Promise.all([
    membershipService.listCustomerProfiles({
      customer_id: customerIds,
    }),
    membershipService.listOAuthLinks({
      customer_id: customerIds,
      provider: "line",
    }),
    orderService.listOrders(
      {
        customer_id: customerIds,
      },
      {
        order: {
          created_at: "DESC",
          id: "DESC",
        },
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

  const profileByCustomerId = buildProfileMap(
    profiles as MembershipCustomerProfileRecord[]
  )
  const lastOrderedAtByCustomerId = buildLastOrderedAtMap(orders as OrderRecord[])
  const lineBindingStatusByCustomerId = buildLineBindingStatusMap(
    oauthLinks as MembershipOAuthLinkRecord[]
  )
  const membershipLevelByCustomerId = buildCustomerMembershipLevelMap({
    customerIds,
    orders: orders as OrderRecord[],
    levels: levels as Awaited<
      ReturnType<MembershipModuleService["listMemberLevels"]>
    >,
  })

  return {
    customers: rows.map((customer) =>
      toAdminCustomerMembershipListItem({
        customer,
        profile: profileByCustomerId.get(customer.id) ?? null,
        lastOrderedAt: lastOrderedAtByCustomerId.get(customer.id) ?? null,
        lineBindingStatus:
          lineBindingStatusByCustomerId.get(customer.id) ?? "unbound",
        currentLevel:
          membershipLevelByCustomerId.get(customer.id)?.current_level ?? null,
      })
    ),
    metadata,
  }
}
