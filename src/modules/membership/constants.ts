import {
  CUSTOMER_GENDERS,
  type CustomerGender,
} from "../../lib/membership/customer-gender"

export const POINT_LOG_SOURCES = [
  "order",
  "birthday_bonus",
  "refund",
  "admin",
  "expire",
  "redeem",
  "bonus",
  "upgrade_gift",
] as const

export const SUBSCRIPTION_STATUSES = [
  "active",
  "paused",
  "canceled",
  "expired",
] as const

export const BILLING_INTERVALS = [
  "monthly",
  "yearly",
  "one_time",
] as const

export const OAUTH_PROVIDERS = [
  "line",
  "google",
  "facebook",
  "apple",
] as const

export const PET_SPECIES = [
  "dog",
  "cat",
  "bird",
  "other",
] as const

export const PET_GENDERS = [
  "male",
  "female",
  "unknown",
] as const

export const AUDIT_ACTOR_TYPES = [
  "customer",
  "admin",
  "system",
] as const

export { CUSTOMER_GENDERS }

export type PointLogSource = (typeof POINT_LOG_SOURCES)[number]
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]
export type BillingInterval = (typeof BILLING_INTERVALS)[number]
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]
export type PetSpecies = (typeof PET_SPECIES)[number]
export type PetGender = (typeof PET_GENDERS)[number]
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number]
export type { CustomerGender }
