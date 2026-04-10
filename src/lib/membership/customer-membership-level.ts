import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { Link } from "@medusajs/modules-sdk"
import type { GraphResultSet } from "@medusajs/types"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import type MembershipModuleService from "../../modules/membership/service"
import {
  formatDateTimeString,
  type CustomerMembershipLevelSummary,
} from "./customer-membership-detail"
import { retrieveCustomerWithMembershipLevel } from "./customer-membership"
import {
  buildMembershipSpendSnapshot,
  type MembershipSpendOrder,
} from "./membership-spend"
import { selectMembershipLevelByYearlySpent } from "./membership-level-rules"
import { getMembershipOrderRewardableTotal } from "./membership-order-accounting"

const CUSTOMER_LINKABLE_KEY = "customer_id"
const MEMBER_LEVEL_LINKABLE_KEY = "membership_member_level_id"

type MembershipLevelRecord =
  GraphResultSet<"membership_member_level">["data"][number]

export type CustomerMembershipOrderRecord = MembershipSpendOrder & {
  id?: string
  customer_id?: string | null
  currency_code?: string | null
  metadata?: Record<string, unknown> | null
}

type QueryGraphService = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

export interface CustomerMembershipLevelComputation {
  current_level: CustomerMembershipLevelSummary | null
  resolved_level: MembershipLevelRecord | null
  total_spent: number
  yearly_spent: number
  currency_code: string
  first_order_at: string | null
  cycle_start: string | null
  matched_threshold: number | null
  used_fallback_level: boolean
}

export interface CustomerMembershipLevelRecalculationResult
  extends CustomerMembershipLevelComputation {
  customer_id: string
  previous_level: CustomerMembershipLevelSummary | null
  changed: boolean
}

interface RecalculateCustomerMembershipLevelInput {
  customerId: string
  actorType: "admin" | "system"
  actorId: string
  reason: string
  action?: string
  ipAddress?: string | null
}

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getQueryGraphService(scope: MedusaContainer): QueryGraphService {
  return scope.resolve<QueryGraphService>(ContainerRegistrationKeys.QUERY)
}

function getLink(scope: MedusaContainer): Link {
  return scope.resolve<Link>(ContainerRegistrationKeys.LINK)
}

function toMembershipLevelSummary(
  level: MembershipLevelRecord | null | undefined
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

function resolveCurrencyCode(orders: CustomerMembershipOrderRecord[]): string {
  const latestOrderWithCurrency = [...orders]
    .filter((order) => typeof order.currency_code === "string")
    .sort((current, next) => {
      const currentTime = new Date(current.created_at ?? 0).getTime()
      const nextTime = new Date(next.created_at ?? 0).getTime()

      return nextTime - currentTime
    })[0]

  return latestOrderWithCurrency?.currency_code ?? "TWD"
}

function groupOrdersByCustomerId(
  customerIds: string[],
  orders: CustomerMembershipOrderRecord[]
): Map<string, CustomerMembershipOrderRecord[]> {
  const ordersByCustomerId = new Map(
    customerIds.map((customerId) => [customerId, [] as CustomerMembershipOrderRecord[]])
  )

  for (const order of orders) {
    const customerId = order.customer_id

    if (!customerId || !ordersByCustomerId.has(customerId)) {
      continue
    }

    ordersByCustomerId.get(customerId)?.push(order)
  }

  return ordersByCustomerId
}

function buildLinkDefinition(customerId: string, memberLevelId: string) {
  return {
    [MEMBERSHIP_MODULE]: {
      [MEMBER_LEVEL_LINKABLE_KEY]: memberLevelId,
    },
    [Modules.CUSTOMER]: {
      [CUSTOMER_LINKABLE_KEY]: customerId,
    },
  }
}

async function listCustomerOrders(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerMembershipOrderRecord[]> {
  const query = getQueryGraphService(scope)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "total",
      "currency_code",
      "created_at",
      "status",
      "metadata",
    ],
    filters: {
      customer_id: customerId,
    },
  })

  return data as CustomerMembershipOrderRecord[]
}

async function listMembershipLevelsForResolution(
  scope: MedusaContainer
): Promise<MembershipLevelRecord[]> {
  const membershipService = getMembershipService(scope)

  return (await membershipService.listMemberLevels(
    {},
    {
      order: {
        upgrade_threshold: "ASC",
        sort_order: "ASC",
        id: "ASC",
      },
    }
  )) as MembershipLevelRecord[]
}

async function syncCustomerMembershipLevelLink(
  scope: MedusaContainer,
  customerId: string,
  previousLevelId: string | null,
  nextLevelId: string | null
): Promise<void> {
  const link = getLink(scope)

  if (previousLevelId && previousLevelId !== nextLevelId) {
    await link.dismiss([buildLinkDefinition(customerId, previousLevelId)])
  }

  if (nextLevelId && previousLevelId !== nextLevelId) {
    await link.create([buildLinkDefinition(customerId, nextLevelId)])
  }
}

export function evaluateCustomerMembershipLevelFromOrders(
  orders: CustomerMembershipOrderRecord[],
  levels: MembershipLevelRecord[],
  referenceAt: Date | string = new Date()
): CustomerMembershipLevelComputation {
  const spendSnapshot = buildMembershipSpendSnapshot(
    orders.map((order) => ({
      ...order,
      total: getMembershipOrderRewardableTotal(order),
    })),
    referenceAt
  )
  const levelMatch = selectMembershipLevelByYearlySpent(
    levels,
    spendSnapshot.yearly_spent
  )

  return {
    current_level: toMembershipLevelSummary(levelMatch.level),
    resolved_level: levelMatch.level,
    total_spent: spendSnapshot.total_spent,
    yearly_spent: spendSnapshot.yearly_spent,
    currency_code: resolveCurrencyCode(orders),
    first_order_at: formatDateTimeString(spendSnapshot.first_order_at),
    cycle_start: formatDateTimeString(spendSnapshot.cycle_start),
    matched_threshold: levelMatch.matched_threshold,
    used_fallback_level: levelMatch.used_fallback_level,
  }
}

export function buildCustomerMembershipLevelMap(input: {
  customerIds: string[]
  orders: CustomerMembershipOrderRecord[]
  levels: MembershipLevelRecord[]
  referenceAt?: Date | string
}): Map<string, CustomerMembershipLevelComputation> {
  const ordersByCustomerId = groupOrdersByCustomerId(
    input.customerIds,
    input.orders
  )

  return new Map(
    input.customerIds.map((customerId) => [
      customerId,
      evaluateCustomerMembershipLevelFromOrders(
        ordersByCustomerId.get(customerId) ?? [],
        input.levels,
        input.referenceAt
      ),
    ])
  )
}

export async function retrieveCustomerMembershipLevelComputation(
  scope: MedusaContainer,
  customerId: string,
  referenceAt: Date | string = new Date()
): Promise<CustomerMembershipLevelComputation> {
  const [orders, levels] = await Promise.all([
    listCustomerOrders(scope, customerId),
    listMembershipLevelsForResolution(scope),
  ])

  return evaluateCustomerMembershipLevelFromOrders(orders, levels, referenceAt)
}

export async function recalculateCustomerMembershipLevel(
  scope: MedusaContainer,
  input: RecalculateCustomerMembershipLevelInput
): Promise<CustomerMembershipLevelRecalculationResult> {
  const membershipService = getMembershipService(scope)
  const customer = await retrieveCustomerWithMembershipLevel(scope, input.customerId)

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${input.customerId} was not found`
    )
  }

  const computation = await retrieveCustomerMembershipLevelComputation(
    scope,
    input.customerId
  )
  const previousLevel = toMembershipLevelSummary(
    customer.membership_member_level ?? null
  )
  const nextLevel = computation.current_level
  const previousLevelId = previousLevel?.id ?? null
  const nextLevelId = nextLevel?.id ?? null
  const changed = previousLevelId !== nextLevelId

  if (changed) {
    await syncCustomerMembershipLevelLink(
      scope,
      input.customerId,
      previousLevelId,
      nextLevelId
    )

    await membershipService.createAuditLog({
      actor_type: input.actorType,
      actor_id: input.actorId,
      action: input.action ?? "customer.membership_level.recalculated",
      target_type: "customer",
      target_id: input.customerId,
      before_state: {
        level_id: previousLevel?.id ?? null,
        level_name: previousLevel?.name ?? null,
      },
      after_state: {
        level_id: nextLevel?.id ?? null,
        level_name: nextLevel?.name ?? null,
      },
      ip_address: input.ipAddress ?? null,
      metadata: {
        reason: input.reason,
        yearly_spent: computation.yearly_spent,
        total_spent: computation.total_spent,
        currency_code: computation.currency_code,
        first_order_at: computation.first_order_at,
        cycle_start: computation.cycle_start,
        matched_threshold: computation.matched_threshold,
        used_fallback_level: computation.used_fallback_level,
      },
    })
  }

  return {
    customer_id: input.customerId,
    previous_level: previousLevel,
    changed,
    ...computation,
  }
}
