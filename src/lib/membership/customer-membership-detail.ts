import type { CustomerGender } from "./customer-gender"

export interface CustomerMembershipLevelSummary {
  id: string
  name: string
  sort_order: number
  reward_rate: number
  birthday_reward_rate: number
  upgrade_gift_points: number
  upgrade_threshold: number
  auto_upgrade: boolean
  can_join_event: boolean
}

export interface CustomerMembershipSummary {
  points: number
  total_points: number
  available_points: number
  expired_points: number
  redeemed_points: number
  refunded_points: number
  total_spent: number
  yearly_spent: number
  currency_code: string
  joined_at: string | null
  current_level: CustomerMembershipLevelSummary | null
}

export interface AdminCustomerMembershipDetail {
  customer_id: string
  phone: string | null
  birthday: string | null
  gender: CustomerGender
  last_login_at: string | null
  summary: CustomerMembershipSummary
}

export interface AdminCustomerMembershipDetailResponse {
  membership: AdminCustomerMembershipDetail
}

export interface AdminUpdateCustomerMembershipRequest {
  phone?: string | null
  birthday?: string | null
  gender?: CustomerGender
}

export interface CustomerSpendSummary {
  total_spent: number
  yearly_spent: number
  currency_code: string
}

function normalizeDateInput(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const dateOnly = new Date(`${value}T00:00:00.000Z`)

    return Number.isNaN(dateOnly.getTime()) ? null : dateOnly
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateOnly(
  value: Date | string | null | undefined
): string | null {
  const normalized = normalizeDateInput(value)

  if (!normalized) {
    return null
  }

  const year = normalized.getUTCFullYear()
  const month = String(normalized.getUTCMonth() + 1).padStart(2, "0")
  const day = String(normalized.getUTCDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function formatDateTimeString(
  value: Date | string | null | undefined
): string | null {
  const normalized = normalizeDateInput(value)

  return normalized ? normalized.toISOString() : null
}

export function toNumberValue(value: unknown): number {
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0

  return Number.isFinite(normalized) ? normalized : 0
}
