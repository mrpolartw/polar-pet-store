import type {
  ICustomerModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { GraphResultSet } from "@medusajs/types"
import type {
  AdminCustomerMembershipDetail,
  AdminUpdateCustomerMembershipRequest,
  CustomerMembershipLevelSummary,
  CustomerSpendSummary,
} from "./customer-membership-detail"
import {
  formatDateOnly,
  formatDateTimeString,
  toNumberValue,
} from "./customer-membership-detail"
import type { CustomerGender } from "./customer-gender"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import type MembershipModuleService from "../../modules/membership/service"
import { retrieveCustomerWithMembershipLevel } from "./customer-membership"
import { calculateAnniversaryYearlySpent } from "./membership-spend"

type CustomerMembershipRecord = NonNullable<
  Awaited<ReturnType<typeof retrieveCustomerWithMembershipLevel>>
>
type MembershipCustomerProfileRecord = NonNullable<
  Awaited<ReturnType<MembershipModuleService["getCustomerProfile"]>>
>
type OrderGraphRecord = GraphResultSet<"order">["data"][number] & {
  total?: number | string | null
  currency_code?: string | null
  created_at?: Date | string | null
  status?: string | null
}
type QueryGraphService = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

type UpdateAdminCustomerMembershipInput = {
  customerId: string
  actorId: string
  ipAddress?: string | null
  payload: AdminUpdateCustomerMembershipRequest
}

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getCustomerService(scope: MedusaContainer): ICustomerModuleService {
  return scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
}

function getQueryGraphService(scope: MedusaContainer): QueryGraphService {
  return scope.resolve<QueryGraphService>(ContainerRegistrationKeys.QUERY)
}

function toCurrentLevelSummary(
  level: CustomerMembershipRecord["membership_member_level"]
): CustomerMembershipLevelSummary | null {
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

async function ensureCustomerMembership(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerMembershipRecord> {
  const customer = await retrieveCustomerWithMembershipLevel(scope, customerId)

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${customerId} was not found`
    )
  }

  return customer as CustomerMembershipRecord
}

function buildCustomerSpendSummary(
  orders: OrderGraphRecord[],
  now: Date = new Date()
): CustomerSpendSummary {
  let totalSpent = 0
  let currencyCode = "TWD"

  for (const order of orders) {
    if (order.status !== "completed" && order.status !== "archived") {
      continue
    }

    totalSpent += toNumberValue(order.total)
    currencyCode = order.currency_code ?? currencyCode
  }

  return {
    total_spent: totalSpent,
    yearly_spent: calculateAnniversaryYearlySpent(orders, now),
    currency_code: currencyCode,
  }
}

async function listCustomerOrders(
  scope: MedusaContainer,
  customerId: string
): Promise<OrderGraphRecord[]> {
  const query = getQueryGraphService(scope)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "total", "currency_code", "created_at", "status"],
    filters: {
      customer_id: customerId,
    },
  })

  return data as OrderGraphRecord[]
}

function buildMembershipDetailRecord(input: {
  customer: CustomerMembershipRecord
  profile: MembershipCustomerProfileRecord | null
  points: number
  spend: CustomerSpendSummary
}): AdminCustomerMembershipDetail {
  return {
    customer_id: input.customer.id,
    phone: input.customer.phone ?? null,
    birthday: formatDateOnly(input.profile?.birthday),
    gender: (input.profile?.gender ?? "undisclosed") as CustomerGender,
    last_login_at: formatDateTimeString(input.profile?.last_login_at),
    summary: {
      points: input.points,
      total_spent: input.spend.total_spent,
      yearly_spent: input.spend.yearly_spent,
      currency_code: input.spend.currency_code,
      joined_at: formatDateTimeString(input.customer.created_at),
      current_level: toCurrentLevelSummary(
        input.customer.membership_member_level ?? null
      ),
    },
  }
}

function parseMembershipDateInput(
  value: string | null | undefined,
  fieldName: string
): Date | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must be a valid date`
    )
  }

  const normalized = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(normalized.getTime()) ||
    normalized.toISOString().slice(0, 10) !== value
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must be a valid date`
    )
  }

  return normalized
}

function normalizeProfileUpdatePayload(
  payload: AdminUpdateCustomerMembershipRequest
): {
  birthday?: Date | null
  gender?: CustomerGender
} {
  const normalized: {
    birthday?: Date | null
    gender?: CustomerGender
  } = {}

  if ("birthday" in payload) {
    normalized.birthday = parseMembershipDateInput(payload.birthday, "birthday")
  }

  if ("gender" in payload && payload.gender !== undefined) {
    normalized.gender = payload.gender
  }

  return normalized
}

function getAuditSnapshot(detail: AdminCustomerMembershipDetail) {
  return {
    phone: detail.phone,
    birthday: detail.birthday,
    gender: detail.gender,
  }
}

function getChangedFields(
  before: ReturnType<typeof getAuditSnapshot>,
  after: ReturnType<typeof getAuditSnapshot>
): string[] {
  return (Object.keys(before) as Array<keyof typeof before>).filter(
    (field) => before[field] !== after[field]
  )
}

export async function retrieveAdminCustomerMembershipDetail(
  scope: MedusaContainer,
  customerId: string
): Promise<AdminCustomerMembershipDetail> {
  const membershipService = getMembershipService(scope)
  const customer = await ensureCustomerMembership(scope, customerId)
  const [profile, points, orders] = await Promise.all([
    membershipService.getCustomerProfile(customerId),
    membershipService.getCustomerPoints(customerId),
    listCustomerOrders(scope, customerId),
  ])

  return buildMembershipDetailRecord({
    customer,
    profile,
    points: points.balance,
    spend: buildCustomerSpendSummary(orders),
  })
}

export async function updateAdminCustomerMembership(
  scope: MedusaContainer,
  input: UpdateAdminCustomerMembershipInput
): Promise<AdminCustomerMembershipDetail> {
  const membershipService = getMembershipService(scope)
  const customerService = getCustomerService(scope)
  const before = await retrieveAdminCustomerMembershipDetail(
    scope,
    input.customerId
  )

  if ("phone" in input.payload) {
    await customerService.updateCustomers(input.customerId, {
      phone: input.payload.phone ?? null,
    })
  }

  const normalizedProfile = normalizeProfileUpdatePayload(input.payload)

  if (Object.keys(normalizedProfile).length > 0) {
    await membershipService.upsertCustomerProfile(
      input.customerId,
      normalizedProfile
    )
  }

  const after = await retrieveAdminCustomerMembershipDetail(
    scope,
    input.customerId
  )

  await membershipService.createAuditLog({
    actor_type: "admin",
    actor_id: input.actorId,
    action: "customer.membership_profile.updated",
    target_type: "customer",
    target_id: input.customerId,
    before_state: getAuditSnapshot(before),
    after_state: getAuditSnapshot(after),
    ip_address: input.ipAddress ?? null,
    metadata: {
      changed_fields: getChangedFields(
        getAuditSnapshot(before),
        getAuditSnapshot(after)
      ),
      source: "admin_customer_membership_widget",
    },
  })

  return after
}
