export type MembershipSpendOrder = {
  total?: number | string | null
  created_at?: Date | string | null
  status?: string | null
}

export interface MembershipSpendSnapshot {
  first_order_at: Date | null
  cycle_start: Date | null
  total_spent: number
  yearly_spent: number
}

const VALID_MEMBERSHIP_ORDER_STATUSES = new Set(["completed", "archived"])

function normalizeDateInput(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const parsed =
    value instanceof Date ? new Date(value.getTime()) : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate()
    )
  )
}

export function toNumberValue(value: number | string | null | undefined): number {
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  return Number.isFinite(normalized) ? normalized : 0
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function buildAnniversaryDate(firstOrderAt: Date, year: number): Date {
  const month = firstOrderAt.getUTCMonth()
  const day = Math.min(firstOrderAt.getUTCDate(), getDaysInMonth(year, month))

  return new Date(Date.UTC(year, month, day))
}

function toEligibleDatedOrders(orders: MembershipSpendOrder[]) {
  return orders
    .map((order) => ({
      ...order,
      normalizedCreatedAt: normalizeDateInput(order.created_at),
    }))
    .filter(
      (
        order
      ): order is MembershipSpendOrder & {
        normalizedCreatedAt: Date
      } =>
        !!order.normalizedCreatedAt &&
        VALID_MEMBERSHIP_ORDER_STATUSES.has(order.status ?? "")
    )
    .sort(
      (current, next) =>
        current.normalizedCreatedAt.getTime() -
        next.normalizedCreatedAt.getTime()
    )
}

export function getMembershipYearCycleStart(
  firstOrderAt: Date | string,
  referenceAt: Date | string
): Date {
  const normalizedFirstOrder = normalizeDateInput(firstOrderAt)
  const normalizedReference = normalizeDateInput(referenceAt)

  if (!normalizedFirstOrder || !normalizedReference) {
    throw new Error("firstOrderAt and referenceAt must be valid dates")
  }

  if (normalizedReference < normalizedFirstOrder) {
    return normalizedFirstOrder
  }

  let cycleStart = buildAnniversaryDate(
    normalizedFirstOrder,
    normalizedReference.getUTCFullYear()
  )

  if (cycleStart > normalizedReference) {
    cycleStart = buildAnniversaryDate(
      normalizedFirstOrder,
      normalizedReference.getUTCFullYear() - 1
    )
  }

  if (cycleStart < normalizedFirstOrder) {
    return normalizedFirstOrder
  }

  return cycleStart
}

export function getFirstMembershipOrderDate(
  orders: MembershipSpendOrder[]
): Date | null {
  return toEligibleDatedOrders(orders)[0]?.normalizedCreatedAt ?? null
}

export function calculateMembershipTotalSpent(
  orders: MembershipSpendOrder[]
): number {
  return toEligibleDatedOrders(orders).reduce(
    (total, order) => total + toNumberValue(order.total),
    0
  )
}

export function calculateAnniversaryYearlySpent(
  orders: MembershipSpendOrder[],
  referenceAt: Date | string = new Date()
): number {
  const normalizedReference = normalizeDateInput(referenceAt)

  if (!normalizedReference) {
    throw new Error("referenceAt must be a valid date")
  }

  const eligibleOrders = toEligibleDatedOrders(orders)
  const firstOrderAt = eligibleOrders[0]?.normalizedCreatedAt

  if (!firstOrderAt) {
    return 0
  }

  const cycleStart = getMembershipYearCycleStart(firstOrderAt, normalizedReference)

  return eligibleOrders.reduce((total, order) => {
    if (
      order.normalizedCreatedAt < cycleStart ||
      order.normalizedCreatedAt > normalizedReference
    ) {
      return total
    }

    return total + toNumberValue(order.total)
  }, 0)
}

export function buildMembershipSpendSnapshot(
  orders: MembershipSpendOrder[],
  referenceAt: Date | string = new Date()
): MembershipSpendSnapshot {
  const normalizedReference = normalizeDateInput(referenceAt)

  if (!normalizedReference) {
    throw new Error("referenceAt must be a valid date")
  }

  const firstOrderAt = getFirstMembershipOrderDate(orders)

  if (!firstOrderAt) {
    return {
      first_order_at: null,
      cycle_start: null,
      total_spent: 0,
      yearly_spent: 0,
    }
  }

  return {
    first_order_at: firstOrderAt,
    cycle_start: getMembershipYearCycleStart(firstOrderAt, normalizedReference),
    total_spent: calculateMembershipTotalSpent(orders),
    yearly_spent: calculateAnniversaryYearlySpent(orders, normalizedReference),
  }
}
