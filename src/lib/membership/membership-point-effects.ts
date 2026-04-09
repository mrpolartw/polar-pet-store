import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type { GraphResultSet } from "@medusajs/types"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import type MembershipModuleService from "../../modules/membership/service"
import { recalculateCustomerMembershipLevel } from "./customer-membership-level"
import { formatDateTimeString } from "./customer-membership-detail"
import { buildMembershipPointsSnapshot } from "./membership-point-balance"

type QueryGraphService = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

type PointLogRecord = GraphResultSet<"membership_point_log">["data"][number]
type OrderRecord = GraphResultSet<"order">["data"][number] & {
  id: string
  customer_id?: string | null
  total?: number | string | null
  currency_code?: string | null
  created_at?: string | Date | null
  status?: string | null
}

type ActorType = "admin" | "customer" | "system"

export interface MembershipPointRedemptionResult {
  customer_id: string
  reference_id: string
  redeemed_points: number
  redemption_amount: number
  created: boolean
  point_log_id: string | null
  available_points_before: number
  available_points_after: number
}

export interface MembershipOrderRefundEffectsResult {
  order_id: string
  customer_id: string
  reference_id: string
  original_refund_amount: number
  clawed_back_points: number
  actual_refund_amount: number
  processed: boolean
  point_log_id: string | null
  recalculated: boolean
}

export interface ExpireMembershipPointsResult {
  customer_id: string
  reference_at: string
  processed: boolean
  expired_points: number
  processed_logs_count: number
  pending_expired_points_after: number
}

interface ApplyMembershipPointRedemptionInput {
  customerId: string
  referenceId: string
  points: number
  actorType: ActorType
  actorId: string
  processedAt?: Date | string
  note?: string | null
  metadata?: Record<string, unknown> | null
}

interface ProcessOrderRefundMembershipEffectsInput {
  orderId: string
  referenceId?: string
  originalRefundAmount: number
  actorType: ActorType
  actorId: string
  processedAt?: Date | string
  note?: string | null
}

interface ExpireMembershipPointsInput {
  customerId: string
  actorType?: ActorType
  actorId?: string
  referenceAt?: Date | string
}

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getQueryGraphService(scope: MedusaContainer): QueryGraphService {
  return scope.resolve<QueryGraphService>(ContainerRegistrationKeys.QUERY)
}

function toNumberValue(value: number | string | null | undefined): number {
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  return Number.isFinite(normalized) ? normalized : 0
}

function getProcessedAt(value?: Date | string): Date {
  const normalized = value ? new Date(value) : new Date()

  if (Number.isNaN(normalized.getTime())) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "processedAt must be a valid date"
    )
  }

  return normalized
}

function buildRefundReferenceId(orderId: string, referenceId?: string): string {
  return referenceId?.trim().length ? referenceId : `refund:order:${orderId}`
}

function buildExpireReferenceId(pointLogId: string): string {
  return `expire:grant:${pointLogId}`
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

async function listOrderRewardPointLogs(
  scope: MedusaContainer,
  customerId: string,
  orderId: string
): Promise<PointLogRecord[]> {
  const membershipService = getMembershipService(scope)
  const pointLogs = (await membershipService.listPointLogs(
    {
      customer_id: customerId,
      reference_id: orderId,
    },
    {
      order: {
        created_at: "ASC",
        id: "ASC",
      },
    }
  )) as PointLogRecord[]

  return pointLogs.filter(
    (pointLog) =>
      pointLog.points > 0 &&
      (pointLog.source === "order" || pointLog.source === "birthday_bonus")
  )
}

async function createPointsAuditLog(input: {
  scope: MedusaContainer
  actorType: ActorType
  actorId: string
  customerId: string
  action: string
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  const membershipService = getMembershipService(input.scope)

  await membershipService.createAuditLog({
    actor_type: input.actorType,
    actor_id: input.actorId,
    action: input.action,
    target_type: "customer",
    target_id: input.customerId,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
    metadata: input.metadata ?? null,
  })
}

export async function applyMembershipPointRedemption(
  scope: MedusaContainer,
  input: ApplyMembershipPointRedemptionInput
): Promise<MembershipPointRedemptionResult> {
  if (!Number.isInteger(input.points) || input.points <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "points must be a positive integer"
    )
  }

  const membershipService = getMembershipService(scope)
  const processedAt = getProcessedAt(input.processedAt)
  const existingPointLog = await membershipService.getPointLogByReference(
    input.customerId,
    "redeem",
    input.referenceId
  )

  if (existingPointLog) {
    const currentPoints = await membershipService.getCustomerPoints(
      input.customerId,
      processedAt
    )

    return {
      customer_id: input.customerId,
      reference_id: input.referenceId,
      redeemed_points: Math.abs(existingPointLog.points),
      redemption_amount: Math.abs(existingPointLog.points),
      created: false,
      point_log_id: existingPointLog.id,
      available_points_before: currentPoints.summary.available_points,
      available_points_after: currentPoints.summary.available_points,
    }
  }

  const beforePoints = await membershipService.getCustomerPoints(
    input.customerId,
    processedAt
  )

  if (beforePoints.summary.available_points < input.points) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Insufficient available points"
    )
  }

  const pointLogResult = await membershipService.createPointLogOnce({
    customer_id: input.customerId,
    points: -input.points,
    source: "redeem",
    reference_id: input.referenceId,
    note: input.note ?? `點數折抵 ${input.referenceId}`,
    expired_at: null,
    metadata: {
      reference_id: input.referenceId,
      redemption_amount: input.points,
      ...(input.metadata ?? {}),
    },
  })

  const afterPoints = pointLogResult.created
    ? await membershipService.getCustomerPoints(input.customerId, processedAt)
    : beforePoints

  if (pointLogResult.created) {
    await createPointsAuditLog({
      scope,
      actorType: input.actorType,
      actorId: input.actorId,
      customerId: input.customerId,
      action: "customer.membership_points.redeemed",
      beforeState: {
        available_points: beforePoints.summary.available_points,
        total_points: beforePoints.summary.total_points,
      },
      afterState: {
        available_points: afterPoints.summary.available_points,
        total_points: afterPoints.summary.total_points,
        point_log_id: pointLogResult.point_log.id,
      },
      metadata: {
        reference_id: input.referenceId,
        redeemed_points: input.points,
        redemption_amount: input.points,
      },
    })
  }

  return {
    customer_id: input.customerId,
    reference_id: input.referenceId,
    redeemed_points: Math.abs(pointLogResult.point_log.points),
    redemption_amount: Math.abs(pointLogResult.point_log.points),
    created: pointLogResult.created,
    point_log_id: pointLogResult.point_log.id,
    available_points_before: beforePoints.summary.available_points,
    available_points_after: afterPoints.summary.available_points,
  }
}

export async function processOrderRefundMembershipEffects(
  scope: MedusaContainer,
  input: ProcessOrderRefundMembershipEffectsInput
): Promise<MembershipOrderRefundEffectsResult | null> {
  const order = await retrieveOrder(scope, input.orderId)

  if (!order?.customer_id) {
    return null
  }

  const membershipService = getMembershipService(scope)
  const processedAt = getProcessedAt(input.processedAt)
  const referenceId = buildRefundReferenceId(order.id, input.referenceId)
  const existingPointLog = await membershipService.getPointLogByReference(
    order.customer_id,
    "refund",
    referenceId
  )

  if (existingPointLog) {
    return {
      order_id: order.id,
      customer_id: order.customer_id,
      reference_id: referenceId,
      original_refund_amount: input.originalRefundAmount,
      clawed_back_points: Math.abs(existingPointLog.points),
      actual_refund_amount: Math.max(
        0,
        input.originalRefundAmount - Math.abs(existingPointLog.points)
      ),
      processed: false,
      point_log_id: existingPointLog.id,
      recalculated: false,
    }
  }

  const [rewardLogs, beforePoints] = await Promise.all([
    listOrderRewardPointLogs(scope, order.customer_id, order.id),
    membershipService.getCustomerPoints(order.customer_id, processedAt),
  ])
  const rewardedPoints = rewardLogs.reduce(
    (sum, pointLog) => sum + toNumberValue(pointLog.points),
    0
  )
  const clawedBackPoints = Math.min(
    rewardedPoints,
    beforePoints.summary.available_points
  )

  if (clawedBackPoints <= 0) {
    return {
      order_id: order.id,
      customer_id: order.customer_id,
      reference_id: referenceId,
      original_refund_amount: input.originalRefundAmount,
      clawed_back_points: 0,
      actual_refund_amount: input.originalRefundAmount,
      processed: false,
      point_log_id: null,
      recalculated: false,
    }
  }

  const pointLogResult = await membershipService.createPointLogOnce({
    customer_id: order.customer_id,
    points: -clawedBackPoints,
    source: "refund",
    reference_id: referenceId,
    note: input.note ?? `訂單 ${order.id} 退款扣回點數`,
    expired_at: null,
    metadata: {
      order_id: order.id,
      rewarded_points: rewardedPoints,
      clawed_back_points: clawedBackPoints,
      original_refund_amount: input.originalRefundAmount,
      actual_refund_amount: Math.max(0, input.originalRefundAmount - clawedBackPoints),
      related_reward_log_ids: rewardLogs.map((pointLog) => pointLog.id),
    },
  })
  const actualRefundAmount = Math.max(
    0,
    input.originalRefundAmount - clawedBackPoints
  )

  if (pointLogResult.created) {
    const afterPoints = await membershipService.getCustomerPoints(
      order.customer_id,
      processedAt
    )

    await createPointsAuditLog({
      scope,
      actorType: input.actorType,
      actorId: input.actorId,
      customerId: order.customer_id,
      action: "customer.membership_points.refund_clawed_back",
      beforeState: {
        available_points: beforePoints.summary.available_points,
        total_points: beforePoints.summary.total_points,
      },
      afterState: {
        available_points: afterPoints.summary.available_points,
        total_points: afterPoints.summary.total_points,
        point_log_id: pointLogResult.point_log.id,
      },
      metadata: {
        order_id: order.id,
        reference_id: referenceId,
        original_refund_amount: input.originalRefundAmount,
        actual_refund_amount: actualRefundAmount,
        clawed_back_points: clawedBackPoints,
      },
    })

    await recalculateCustomerMembershipLevel(scope, {
      customerId: order.customer_id,
      actorType: input.actorType === "customer" ? "system" : input.actorType,
      actorId: input.actorType === "customer" ? "system" : input.actorId,
      reason: `order_refund:${referenceId}`,
      action:
        input.actorType === "admin"
          ? "customer.membership_level.recalculated_by_admin"
          : "customer.membership_level.recalculated_by_system",
    })
  }

  return {
    order_id: order.id,
    customer_id: order.customer_id,
    reference_id: referenceId,
    original_refund_amount: input.originalRefundAmount,
    clawed_back_points: Math.abs(pointLogResult.point_log.points),
    actual_refund_amount: actualRefundAmount,
    processed: pointLogResult.created,
    point_log_id: pointLogResult.point_log.id,
    recalculated: pointLogResult.created,
  }
}

export async function expireMembershipPoints(
  scope: MedusaContainer,
  input: ExpireMembershipPointsInput
): Promise<ExpireMembershipPointsResult> {
  const membershipService = getMembershipService(scope)
  const referenceAt = getProcessedAt(input.referenceAt)
  const actorType = input.actorType ?? "system"
  const actorId = input.actorId ?? "system"
  const pointState = await membershipService.getCustomerPoints(
    input.customerId,
    referenceAt
  )
  const expirableLots = pointState.summary.lots.filter(
    (lot) => lot.is_expired && lot.remaining_points > 0 && lot.point_log_id
  )

  if (!expirableLots.length) {
    return {
      customer_id: input.customerId,
      reference_at: formatDateTimeString(referenceAt) ?? referenceAt.toISOString(),
      processed: false,
      expired_points: 0,
      processed_logs_count: 0,
      pending_expired_points_after: 0,
    }
  }

  let expiredPoints = 0
  let processedLogsCount = 0

  for (const lot of expirableLots) {
    const pointLogResult = await membershipService.createPointLogOnce({
      customer_id: input.customerId,
      points: -lot.remaining_points,
      source: "expire",
      reference_id: buildExpireReferenceId(lot.point_log_id!),
      note: "點數到期失效",
      expired_at: null,
      metadata: {
        grant_point_log_id: lot.point_log_id,
        grant_source: lot.source,
        grant_created_at: lot.created_at,
        grant_expired_at: lot.expired_at,
      },
    })

    if (pointLogResult.created) {
      expiredPoints += Math.abs(pointLogResult.point_log.points)
      processedLogsCount += 1
    }
  }

  const afterPoints = await membershipService.getCustomerPoints(
    input.customerId,
    referenceAt
  )

  if (processedLogsCount > 0) {
    await createPointsAuditLog({
      scope,
      actorType,
      actorId,
      customerId: input.customerId,
      action: "customer.membership_points.expired",
      beforeState: {
        pending_expired_points: pointState.summary.pending_expired_points,
        total_points: pointState.summary.total_points,
      },
      afterState: {
        pending_expired_points: afterPoints.summary.pending_expired_points,
        total_points: afterPoints.summary.total_points,
      },
      metadata: {
        expired_points: expiredPoints,
        processed_logs_count: processedLogsCount,
        reference_at: formatDateTimeString(referenceAt),
      },
    })
  }

  return {
    customer_id: input.customerId,
    reference_at: formatDateTimeString(referenceAt) ?? referenceAt.toISOString(),
    processed: processedLogsCount > 0,
    expired_points: expiredPoints,
    processed_logs_count: processedLogsCount,
    pending_expired_points_after: afterPoints.summary.pending_expired_points,
  }
}

export function computeAvailableMembershipPoints(
  logs: PointLogRecord[],
  referenceAt: Date | string = new Date()
): number {
  return buildMembershipPointsSnapshot(logs, referenceAt).available_points
}
