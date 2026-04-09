import type { MembershipCustomer } from "./types"

export function formatDate(value?: string | null): string {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
  }).format(date)
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatCurrency(
  amount?: number | null,
  currencyCode = "TWD"
): string {
  if (amount === null || amount === undefined) {
    return "-"
  }

  try {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currencyCode} ${amount}`
  }
}

export function stringifyJson(
  value: Record<string, unknown> | null | undefined
): string {
  if (!value) {
    return "-"
  }

  return JSON.stringify(value, null, 2)
}

export function getCustomerDisplayName(customer: MembershipCustomer): string {
  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  if (fullName) {
    return fullName
  }

  if (customer.email) {
    return customer.email
  }

  return customer.id
}
