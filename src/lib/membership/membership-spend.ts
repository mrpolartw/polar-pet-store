export type MembershipSpendOrder = {
  total?: number | string | null
  created_at?: Date | string | null
  status?: string | null
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

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate()
    )
  )
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function buildAnniversaryDate(firstOrderAt: Date, year: number): Date {
  const month = firstOrderAt.getUTCMonth()
  const day = Math.min(firstOrderAt.getUTCDate(), getDaysInMonth(year, month))

  return new Date(Date.UTC(year, month, day))
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

export function calculateAnniversaryYearlySpent(
  orders: MembershipSpendOrder[],
  referenceAt: Date | string = new Date()
): number {
  const normalizedReference = normalizeDateInput(referenceAt)

  if (!normalizedReference) {
    throw new Error("referenceAt must be a valid date")
  }

  const datedOrders = orders
    .map((order) => ({
      ...order,
      normalizedCreatedAt: normalizeDateInput(order.created_at),
    }))
    .filter(
      (
        order
      ): order is MembershipSpendOrder & {
        normalizedCreatedAt: Date
      } => !!order.normalizedCreatedAt
    )
    .sort(
      (current, next) =>
        current.normalizedCreatedAt.getTime() -
        next.normalizedCreatedAt.getTime()
    )

  if (!datedOrders.length) {
    return 0
  }

  const cycleStart = getMembershipYearCycleStart(
    datedOrders[0].normalizedCreatedAt,
    normalizedReference
  )

  return datedOrders.reduce((total, order) => {
    if (
      (order.status !== "completed" && order.status !== "archived") ||
      order.normalizedCreatedAt < cycleStart ||
      order.normalizedCreatedAt > normalizedReference
    ) {
      return total
    }

    return total + toNumberValue(order.total)
  }, 0)
}
