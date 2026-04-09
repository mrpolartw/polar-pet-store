import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { GraphResultSet } from "@medusajs/types"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import type MembershipModuleService from "../../modules/membership/service"
import type { PointLogSource } from "../../modules/membership/constants"
import {
  type CustomerMembershipLevelRecalculationResult,
  evaluateCustomerMembershipLevelFromOrders,
  recalculateCustomerMembershipLevel,
} from "./customer-membership-level"
import {
  isMembershipLevelUpgrade,
} from "./membership-level-rules"
import {
  calculateOrderRewardPoints,
  calculatePointExpirationDate,
  isBirthdayRewardDate,
  type MembershipRewardLevel,
} from "./membership-points"
import {
  formatDateTimeString,
  type CustomerMembershipLevelSummary,
} from "./customer-membership-detail"

type QueryGraphService = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

type MembershipLevelRecord =
  GraphResultSet<"membership_member_level">["data"][number]

type OrderRecord = GraphResultSet<"order">["data"][number] & {
  id: string
  customer_id?: string | null
  total?: number | string | null
  currency_code?: string | null
  created_at?: string | Date | null
  status?: string | null
}

type OrderRewardEvaluation = {
  reward_level: CustomerMembershipLevelSummary | null
  reward_level_record: MembershipLevelRecord | null
  points: number
  applied_rate: number
  used_birthday_bonus: boolean
  source: "order" | "birthday_bonus"
}

export interface OrderCompletionMembershipEffectsResult {
  order_id: string
  customer_id: string
  reward: {
    points: number
    created: boolean
    point_log_id: string | null
    source: "order" | "birthday_bonus"
    applied_rate: number
    used_birthday_bonus: boolean
    expires_at: string | null
    level: CustomerMembershipLevelSummary | null
  }
  recalculation: CustomerMembershipLevelRecalculationResult
  upgrade_gift: {
    points: number
    created: boolean
    point_log_id: string | null
    expires_at: string | null
  }
}

type ProcessOrderCompletionMembershipEffectsInput = {
  orderId: string
  processedAt?: Date | string
  actorType?: "system" | "admin"
  actorId?: string
}

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getQueryGraphService(scope: MedusaContainer): QueryGraphService {
  return scope.resolve<QueryGraphService>(ContainerRegistrationKeys.QUERY)
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

function buildOrderRewardReferenceId(orderId: string): string {
  return orderId
}

function buildUpgradeGiftReferenceId(input: {
  orderId: string
  previousLevelId: string | null
  currentLevelId: string
}): string {
  return `order:${input.orderId}:upgrade:${input.previousLevelId ?? "none"}:${input.currentLevelId}`
}

function buildPointAwardAuditAction(source: PointLogSource): string {
  switch (source) {
    case "birthday_bonus":
      return "customer.membership_points.awarded_birthday_bonus"
    case "upgrade_gift":
      return "customer.membership_points.awarded_upgrade_gift"
    case "order":
    default:
      return "customer.membership_points.awarded_order_reward"
  }
}

function buildPointAwardNote(source: PointLogSource, orderId: string): string {
  switch (source) {
    case "birthday_bonus":
      return `訂單 ${orderId} 生日加碼點數`
    case "upgrade_gift":
      return `訂單 ${orderId} 升等贈點`
    case "order":
    default:
      return `訂單 ${orderId} 完成回饋點數`
  }
}

async function retrieveOrder(
  scope: MedusaContainer,
  orderId: string
): Promise<OrderRecord | null> {
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
    ],
    filters: {
      id: orderId,
    },
  })

  return (data[0] as OrderRecord | undefined) ?? null
}

async function listCustomerOrders(
  scope: MedusaContainer,
  customerId: string
): Promise<OrderRecord[]> {
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
    ],
    filters: {
      customer_id: customerId,
    },
  })

  return data as OrderRecord[]
}

async function listMembershipLevels(
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

export function evaluateOrderRewardFromMembershipRules(input: {
  order: OrderRecord
  orders: OrderRecord[]
  levels: MembershipLevelRecord[]
  birthday: Date | string | null | undefined
}): OrderRewardEvaluation {
  const priorOrders = input.orders.filter(
    (candidate) => candidate.id !== input.order.id
  )
  const priorLevelComputation = evaluateCustomerMembershipLevelFromOrders(
    priorOrders,
    input.levels,
    input.order.created_at ?? new Date()
  )
  const birthdayEligible = isBirthdayRewardDate(
    input.birthday,
    input.order.created_at ?? new Date()
  )
  const rewardComputation = calculateOrderRewardPoints({
    orderTotal: input.order.total,
    level: (priorLevelComputation.resolved_level ?? null) as MembershipRewardLevel | null,
    isBirthdayRewardDate: birthdayEligible,
  })

  return {
    reward_level: priorLevelComputation.current_level,
    reward_level_record: priorLevelComputation.resolved_level,
    points: rewardComputation.points,
    applied_rate: rewardComputation.applied_rate,
    used_birthday_bonus: rewardComputation.used_birthday_bonus,
    source: rewardComputation.source,
  }
}

async function createPointAwardAuditLog(input: {
  scope: MedusaContainer
  actorType: "system" | "admin"
  actorId: string
  customerId: string
  source: PointLogSource
  pointLogId: string
  delta: number
  balanceAfter: number
  metadata: Record<string, unknown>
}): Promise<void> {
  const membershipService = getMembershipService(input.scope)

  await membershipService.createAuditLog({
    actor_type: input.actorType,
    actor_id: input.actorId,
    action: buildPointAwardAuditAction(input.source),
    target_type: "customer",
    target_id: input.customerId,
    before_state: null,
    after_state: {
      point_log_id: input.pointLogId,
      delta: input.delta,
      balance_after: input.balanceAfter,
      source: input.source,
    },
    metadata: input.metadata,
  })
}

function shouldIssueUpgradeGift(
  recalculation: CustomerMembershipLevelRecalculationResult
): boolean {
  if (!recalculation.changed || !recalculation.current_level) {
    return false
  }

  return isMembershipLevelUpgrade(
    recalculation.previous_level,
    recalculation.current_level
  )
}

export async function processOrderCompletionMembershipEffects(
  scope: MedusaContainer,
  input: ProcessOrderCompletionMembershipEffectsInput
): Promise<OrderCompletionMembershipEffectsResult | null> {
  const order = await retrieveOrder(scope, input.orderId)

  if (!order?.customer_id) {
    return null
  }

  const membershipService = getMembershipService(scope)
  const processedAt = input.processedAt ?? new Date()
  const actorType = input.actorType ?? "system"
  const actorId = input.actorId ?? "system"

  const [orders, levels, profile] = await Promise.all([
    listCustomerOrders(scope, order.customer_id),
    listMembershipLevels(scope),
    membershipService.getCustomerProfile(order.customer_id),
  ])

  const rewardEvaluation = evaluateOrderRewardFromMembershipRules({
    order,
    orders,
    levels,
    birthday: profile?.birthday ?? null,
  })
  const rewardExpiresAt =
    rewardEvaluation.points > 0
      ? calculatePointExpirationDate(processedAt)
      : null
  const rewardReferenceId = buildOrderRewardReferenceId(order.id)
  const rewardMetadata = {
    order_id: order.id,
    order_total: order.total ?? 0,
    currency_code: order.currency_code ?? "TWD",
    level_id: rewardEvaluation.reward_level?.id ?? null,
    level_name: rewardEvaluation.reward_level?.name ?? null,
    applied_rate: rewardEvaluation.applied_rate,
    used_birthday_bonus: rewardEvaluation.used_birthday_bonus,
  }

  const rewardPointLogResult =
    rewardEvaluation.points > 0
      ? await membershipService.createPointLogOnce({
          customer_id: order.customer_id,
          points: rewardEvaluation.points,
          source: rewardEvaluation.source,
          reference_id: rewardReferenceId,
          note: buildPointAwardNote(rewardEvaluation.source, order.id),
          expired_at: rewardExpiresAt,
          metadata: rewardMetadata,
        })
      : null

  if (rewardPointLogResult?.created) {
    await createPointAwardAuditLog({
      scope,
      actorType,
      actorId,
      customerId: order.customer_id,
      source: rewardEvaluation.source,
      pointLogId: rewardPointLogResult.point_log.id,
      delta: rewardPointLogResult.point_log.points,
      balanceAfter: rewardPointLogResult.point_log.balance_after,
      metadata: rewardMetadata,
    })
  }

  const recalculation = await recalculateCustomerMembershipLevel(scope, {
    customerId: order.customer_id,
    actorType,
    actorId,
    reason: `order_completed:${order.id}`,
    action:
      actorType === "admin"
        ? "customer.membership_level.recalculated_by_admin"
        : "customer.membership_level.recalculated_by_system",
  })

  let upgradeGiftPoints = 0
  let upgradeGiftCreated = false
  let upgradeGiftPointLogId: string | null = null
  let upgradeGiftExpiresAt: Date | null = null

  if (
    shouldIssueUpgradeGift(recalculation) &&
    (recalculation.current_level?.upgrade_gift_points ?? 0) > 0
  ) {
    upgradeGiftPoints = recalculation.current_level?.upgrade_gift_points ?? 0
    upgradeGiftExpiresAt = calculatePointExpirationDate(processedAt)
    const upgradeGiftReferenceId = buildUpgradeGiftReferenceId({
      orderId: order.id,
      previousLevelId: recalculation.previous_level?.id ?? null,
      currentLevelId: recalculation.current_level!.id,
    })
    const upgradeGiftMetadata = {
      order_id: order.id,
      previous_level_id: recalculation.previous_level?.id ?? null,
      previous_level_name: recalculation.previous_level?.name ?? null,
      current_level_id: recalculation.current_level?.id ?? null,
      current_level_name: recalculation.current_level?.name ?? null,
      matched_threshold: recalculation.matched_threshold,
      yearly_spent: recalculation.yearly_spent,
    }
    const upgradeGiftPointLogResult = await membershipService.createPointLogOnce({
      customer_id: order.customer_id,
      points: upgradeGiftPoints,
      source: "upgrade_gift",
      reference_id: upgradeGiftReferenceId,
      note: buildPointAwardNote("upgrade_gift", order.id),
      expired_at: upgradeGiftExpiresAt,
      metadata: upgradeGiftMetadata,
    })

    upgradeGiftCreated = upgradeGiftPointLogResult.created
    upgradeGiftPointLogId = upgradeGiftPointLogResult.point_log.id

    if (upgradeGiftPointLogResult.created) {
      await createPointAwardAuditLog({
        scope,
        actorType,
        actorId,
        customerId: order.customer_id,
        source: "upgrade_gift",
        pointLogId: upgradeGiftPointLogResult.point_log.id,
        delta: upgradeGiftPointLogResult.point_log.points,
        balanceAfter: upgradeGiftPointLogResult.point_log.balance_after,
        metadata: upgradeGiftMetadata,
      })
    }
  }

  return {
    order_id: order.id,
    customer_id: order.customer_id,
    reward: {
      points: rewardEvaluation.points,
      created: rewardPointLogResult?.created ?? false,
      point_log_id: rewardPointLogResult?.point_log.id ?? null,
      source: rewardEvaluation.source,
      applied_rate: rewardEvaluation.applied_rate,
      used_birthday_bonus: rewardEvaluation.used_birthday_bonus,
      expires_at: formatDateTimeString(rewardExpiresAt),
      level: rewardEvaluation.reward_level,
    },
    recalculation,
    upgrade_gift: {
      points: upgradeGiftPoints,
      created: upgradeGiftCreated,
      point_log_id: upgradeGiftPointLogId,
      expires_at: formatDateTimeString(upgradeGiftExpiresAt),
    },
  }
}
