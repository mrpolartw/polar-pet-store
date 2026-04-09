export interface MembershipRewardLevel {
  id: string
  name: string
  reward_rate: number
  birthday_reward_rate: number
}

export type MembershipBirthdayRewardWindowMode = "day"

export interface MembershipOrderPointsComputation {
  points: number
  applied_rate: number
  used_birthday_bonus: boolean
  source: "order" | "birthday_bonus"
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function buildClampedDate(
  sourceDate: Date,
  year: number
): Date {
  const month = sourceDate.getUTCMonth()
  const day = Math.min(sourceDate.getUTCDate(), getDaysInMonth(year, month))

  return new Date(
    Date.UTC(
      year,
      month,
      day,
      sourceDate.getUTCHours(),
      sourceDate.getUTCMinutes(),
      sourceDate.getUTCSeconds(),
      sourceDate.getUTCMilliseconds()
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

export function addClampedYears(
  value: Date | string,
  years: number
): Date {
  const normalized = normalizeDateInput(value)

  if (!normalized) {
    throw new Error("value must be a valid date")
  }

  return buildClampedDate(normalized, normalized.getUTCFullYear() + years)
}

export function calculatePointExpirationDate(
  awardedAt: Date | string = new Date()
): Date {
  return addClampedYears(awardedAt, 1)
}

export function getBirthdayRewardDateForYear(
  birthday: Date | string,
  year: number
): Date {
  const normalizedBirthday = normalizeDateInput(birthday)

  if (!normalizedBirthday) {
    throw new Error("birthday must be a valid date")
  }

  return buildClampedDate(
    new Date(
      Date.UTC(
        normalizedBirthday.getUTCFullYear(),
        normalizedBirthday.getUTCMonth(),
        normalizedBirthday.getUTCDate()
      )
    ),
    year
  )
}

export function isBirthdayRewardDate(
  birthday: Date | string | null | undefined,
  referenceAt: Date | string = new Date(),
  windowMode: MembershipBirthdayRewardWindowMode = "day"
): boolean {
  const normalizedBirthday = normalizeDateInput(birthday)
  const normalizedReference = normalizeDateInput(referenceAt)

  if (!normalizedBirthday || !normalizedReference) {
    return false
  }

  if (windowMode !== "day") {
    throw new Error(`Unsupported birthday reward window mode: ${windowMode}`)
  }

  const rewardDate = getBirthdayRewardDateForYear(
    normalizedBirthday,
    normalizedReference.getUTCFullYear()
  )

  return (
    rewardDate.getUTCFullYear() === normalizedReference.getUTCFullYear() &&
    rewardDate.getUTCMonth() === normalizedReference.getUTCMonth() &&
    rewardDate.getUTCDate() === normalizedReference.getUTCDate()
  )
}

export function calculatePointsFromAmount(
  amount: number | string | null | undefined,
  rewardRate: number | string | null | undefined
): number {
  const normalizedAmount = Math.max(0, toNumberValue(amount))
  const normalizedRewardRate = Math.max(0, toNumberValue(rewardRate))

  if (!normalizedAmount || !normalizedRewardRate) {
    return 0
  }

  return Math.floor((normalizedAmount * normalizedRewardRate) / 100)
}

export function calculateOrderRewardPoints(input: {
  orderTotal: number | string | null | undefined
  level: MembershipRewardLevel | null
  isBirthdayRewardDate: boolean
}): MembershipOrderPointsComputation {
  const appliedRate =
    input.level && input.isBirthdayRewardDate
      ? toNumberValue(input.level.birthday_reward_rate)
      : toNumberValue(input.level?.reward_rate)

  return {
    points: calculatePointsFromAmount(input.orderTotal, appliedRate),
    applied_rate: appliedRate,
    used_birthday_bonus: input.isBirthdayRewardDate && !!input.level,
    source: input.isBirthdayRewardDate ? "birthday_bonus" : "order",
  }
}
