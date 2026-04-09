export type MembershipPointLogLike = {
  id?: string | null
  points?: number | string | null
  balance_after?: number | string | null
  source?: string | null
  reference_id?: string | null
  expired_at?: Date | string | null
  created_at?: Date | string | null
  metadata?: Record<string, unknown> | null
}

export interface MembershipPointLotSnapshot {
  point_log_id: string | null
  source: string | null
  granted_points: number
  remaining_points: number
  expired_at: string | null
  created_at: string | null
  is_expired: boolean
}

export interface MembershipPointsSnapshot {
  total_points: number
  ledger_balance: number
  available_points: number
  expired_points: number
  pending_expired_points: number
  redeemed_points: number
  refunded_points: number
  expired_logged_points: number
  total_earned_points: number
  adjustment_points: number
  last_balance_after: number
  lots: MembershipPointLotSnapshot[]
}

type WorkingPointLot = {
  point_log_id: string | null
  source: string | null
  granted_points: number
  remaining_points: number
  expired_at: Date | null
  created_at: Date | null
}

function normalizeDateInput(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const parsed =
    value instanceof Date ? new Date(value.getTime()) : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function formatDateTimeString(value: Date | null): string | null {
  return value ? value.toISOString() : null
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

function compareByChronology(
  current: MembershipPointLogLike,
  next: MembershipPointLogLike
): number {
  const currentTime = normalizeDateInput(current.created_at)?.getTime() ?? 0
  const nextTime = normalizeDateInput(next.created_at)?.getTime() ?? 0

  if (currentTime !== nextTime) {
    return currentTime - nextTime
  }

  const currentId = current.id ?? ""
  const nextId = next.id ?? ""

  return currentId.localeCompare(nextId)
}

function compareLotsForConsumption(
  current: WorkingPointLot,
  next: WorkingPointLot
): number {
  const currentExpiredAt = current.expired_at?.getTime() ?? Number.MAX_SAFE_INTEGER
  const nextExpiredAt = next.expired_at?.getTime() ?? Number.MAX_SAFE_INTEGER

  if (currentExpiredAt !== nextExpiredAt) {
    return currentExpiredAt - nextExpiredAt
  }

  const currentCreatedAt = current.created_at?.getTime() ?? 0
  const nextCreatedAt = next.created_at?.getTime() ?? 0

  if (currentCreatedAt !== nextCreatedAt) {
    return currentCreatedAt - nextCreatedAt
  }

  return (current.point_log_id ?? "").localeCompare(next.point_log_id ?? "")
}

function isLotExpiredAt(lot: WorkingPointLot, referenceAt: Date): boolean {
  return !!lot.expired_at && lot.expired_at.getTime() <= referenceAt.getTime()
}

function consumeFromLots(lots: WorkingPointLot[], amount: number): number {
  let remaining = amount

  for (const lot of lots) {
    if (remaining <= 0) {
      break
    }

    if (lot.remaining_points <= 0) {
      continue
    }

    const consumed = Math.min(lot.remaining_points, remaining)
    lot.remaining_points -= consumed
    remaining -= consumed
  }

  return remaining
}

function buildWorkingLots(logs: MembershipPointLogLike[]): WorkingPointLot[] {
  const workingLots: WorkingPointLot[] = []

  for (const log of [...logs].sort(compareByChronology)) {
    const points = toNumberValue(log.points)
    const eventAt = normalizeDateInput(log.created_at) ?? new Date(0)

    if (points > 0) {
      workingLots.push({
        point_log_id: log.id ?? null,
        source: log.source ?? null,
        granted_points: points,
        remaining_points: points,
        expired_at: normalizeDateInput(log.expired_at),
        created_at: normalizeDateInput(log.created_at),
      })
      continue
    }

    if (points >= 0) {
      continue
    }

    let remainingToConsume = Math.abs(points)
    const source = log.source ?? null

    if (source === "expire") {
      remainingToConsume = consumeFromLots(
        [...workingLots]
          .filter(
            (lot) =>
              lot.remaining_points > 0 && isLotExpiredAt(lot, eventAt)
          )
          .sort(compareLotsForConsumption),
        remainingToConsume
      )
    } else {
      remainingToConsume = consumeFromLots(
        [...workingLots]
          .filter(
            (lot) =>
              lot.remaining_points > 0 && !isLotExpiredAt(lot, eventAt)
          )
          .sort(compareLotsForConsumption),
        remainingToConsume
      )
    }

    if (remainingToConsume > 0) {
      consumeFromLots(
        [...workingLots]
          .filter((lot) => lot.remaining_points > 0)
          .sort(compareLotsForConsumption),
        remainingToConsume
      )
    }
  }

  return workingLots
}

export function computeAvailableMembershipPoints(
  logs: MembershipPointLogLike[],
  referenceAt: Date | string = new Date()
): number {
  return buildMembershipPointsSnapshot(logs, referenceAt).available_points
}

export function buildMembershipPointsSnapshot(
  logs: MembershipPointLogLike[],
  referenceAt: Date | string = new Date()
): MembershipPointsSnapshot {
  const normalizedReference = normalizeDateInput(referenceAt)

  if (!normalizedReference) {
    throw new Error("referenceAt must be a valid date")
  }

  const sortedLogs = [...logs]
    .sort(compareByChronology)
    .filter((log) => {
      const createdAt = normalizeDateInput(log.created_at)

      return !createdAt || createdAt.getTime() <= normalizedReference.getTime()
    })
  const workingLots = buildWorkingLots(sortedLogs)
  const totalPoints = sortedLogs.reduce(
    (sum, log) => sum + toNumberValue(log.points),
    0
  )
  const lastBalanceAfter =
    toNumberValue(sortedLogs[sortedLogs.length - 1]?.balance_after) || totalPoints
  const totalEarnedPoints = sortedLogs.reduce((sum, log) => {
    const points = toNumberValue(log.points)

    return points > 0 ? sum + points : sum
  }, 0)
  const redeemedPoints = sortedLogs.reduce((sum, log) => {
    const points = toNumberValue(log.points)

    return log.source === "redeem" && points < 0 ? sum + Math.abs(points) : sum
  }, 0)
  const refundedPoints = sortedLogs.reduce((sum, log) => {
    const points = toNumberValue(log.points)

    return log.source === "refund" && points < 0 ? sum + Math.abs(points) : sum
  }, 0)
  const expiredLoggedPoints = sortedLogs.reduce((sum, log) => {
    const points = toNumberValue(log.points)

    return log.source === "expire" && points < 0 ? sum + Math.abs(points) : sum
  }, 0)
  const adjustmentPoints = sortedLogs.reduce((sum, log) => {
    const points = toNumberValue(log.points)

    return log.source === "admin" ? sum + points : sum
  }, 0)
  const pendingExpiredPoints = workingLots.reduce((sum, lot) => {
    if (!lot.remaining_points || !isLotExpiredAt(lot, normalizedReference)) {
      return sum
    }

    return sum + lot.remaining_points
  }, 0)
  const availablePoints = workingLots.reduce((sum, lot) => {
    if (!lot.remaining_points || isLotExpiredAt(lot, normalizedReference)) {
      return sum
    }

    return sum + lot.remaining_points
  }, 0)

  return {
    total_points: totalPoints,
    ledger_balance: totalPoints,
    available_points: availablePoints,
    expired_points: expiredLoggedPoints + pendingExpiredPoints,
    pending_expired_points: pendingExpiredPoints,
    redeemed_points: redeemedPoints,
    refunded_points: refundedPoints,
    expired_logged_points: expiredLoggedPoints,
    total_earned_points: totalEarnedPoints,
    adjustment_points: adjustmentPoints,
    last_balance_after: lastBalanceAfter,
    lots: workingLots.map((lot) => ({
      point_log_id: lot.point_log_id,
      source: lot.source,
      granted_points: lot.granted_points,
      remaining_points: lot.remaining_points,
      expired_at: formatDateTimeString(lot.expired_at),
      created_at: formatDateTimeString(lot.created_at),
      is_expired: isLotExpiredAt(lot, normalizedReference),
    })),
  }
}
