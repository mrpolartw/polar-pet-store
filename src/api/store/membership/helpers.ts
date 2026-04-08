import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import type MembershipModuleService from "../../../modules/membership/service"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import { retrieveCustomerWithMembershipLevel } from "../../../lib/membership/customer-membership"
import type {
  CustomerMembershipGraph,
  PetRecord,
  SubscriptionRecord,
} from "./types"
import type {
  StoreCreatePetType,
  StoreCreateSubscriptionType,
  StoreUpdatePetType,
  StoreUpdateSubscriptionType,
} from "./validators"

export function getCustomerId(req: AuthenticatedMedusaRequest): string {
  return req.auth_context.actor_id
}

export function getMembershipService(
  scope: MedusaContainer
): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

export async function retrieveCustomerMembership(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerMembershipGraph | null> {
  return (await retrieveCustomerWithMembershipLevel(
    scope,
    customerId
  )) as CustomerMembershipGraph | null
}

export async function ensurePetOwnership(
  scope: MedusaContainer,
  customerId: string,
  petId: string
): Promise<PetRecord> {
  const membershipService = getMembershipService(scope)
  const [pet] = (await membershipService.listPets(
    {
      id: petId,
      customer_id: customerId,
    },
    {
      take: 1,
    }
  )) as PetRecord[]

  if (!pet) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Pet with id: ${petId} was not found`
    )
  }

  return pet
}

export async function ensureSubscriptionOwnership(
  scope: MedusaContainer,
  customerId: string,
  subscriptionId: string
): Promise<SubscriptionRecord> {
  const membershipService = getMembershipService(scope)
  const [subscription] = (await membershipService.listSubscriptions(
    {
      id: subscriptionId,
      customer_id: customerId,
    },
    {
      take: 1,
    }
  )) as SubscriptionRecord[]

  if (!subscription) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Subscription with id: ${subscriptionId} was not found`
    )
  }

  return subscription
}

export function normalizePetPayload(
  payload: StoreCreatePetType | StoreUpdatePetType
): {
  name?: string
  species?: "dog" | "cat" | "bird" | "other" | null
  breed?: string | null
  birthday?: Date | null
  gender?: "male" | "female" | "unknown"
  avatar_url?: string | null
  metadata?: Record<string, unknown> | null
} {
  const normalized: {
    name?: string
    species?: "dog" | "cat" | "bird" | "other" | null
    breed?: string | null
    birthday?: Date | null
    gender?: "male" | "female" | "unknown"
    avatar_url?: string | null
    metadata?: Record<string, unknown> | null
  } = {}

  if ("name" in payload && payload.name !== undefined) {
    normalized.name = payload.name
  }

  if ("species" in payload) {
    normalized.species = payload.species ?? null
  }

  if ("breed" in payload) {
    normalized.breed = payload.breed ?? null
  }

  if ("birthday" in payload) {
    normalized.birthday = parseNullableDate(payload.birthday, "birthday")
  }

  if ("gender" in payload && payload.gender !== undefined) {
    normalized.gender = payload.gender
  }

  if ("avatar_url" in payload) {
    normalized.avatar_url = payload.avatar_url ?? null
  }

  if ("metadata" in payload) {
    normalized.metadata = payload.metadata ?? null
  }

  return normalized
}

export function normalizeCreateSubscriptionPayload(
  payload: StoreCreateSubscriptionType
): {
  plan_name: string
  started_at: Date
  expires_at?: Date | null
  next_billing_at?: Date | null
  billing_interval?: "monthly" | "yearly" | "one_time" | null
  amount?: number | null
  currency_code?: string
  metadata?: Record<string, unknown> | null
} {
  return {
    plan_name: payload.plan_name,
    started_at: parseRequiredDate(payload.started_at) ?? new Date(),
    expires_at: parseNullableDate(payload.expires_at, "expires_at"),
    next_billing_at: parseNullableDate(
      payload.next_billing_at,
      "next_billing_at"
    ),
    billing_interval: payload.billing_interval ?? null,
    amount: payload.amount ?? null,
    currency_code: payload.currency_code,
    metadata: payload.metadata ?? null,
  }
}

export function normalizeUpdateSubscriptionPayload(
  payload: StoreUpdateSubscriptionType
): {
  plan_name?: string
  status?: "active" | "paused" | "canceled" | "expired"
  expires_at?: Date | null
  next_billing_at?: Date | null
  billing_interval?: "monthly" | "yearly" | "one_time" | null
  amount?: number | null
  currency_code?: string
  metadata?: Record<string, unknown> | null
} {
  const normalized: {
    plan_name?: string
    status?: "active" | "paused" | "canceled" | "expired"
    expires_at?: Date | null
    next_billing_at?: Date | null
    billing_interval?: "monthly" | "yearly" | "one_time" | null
    amount?: number | null
    currency_code?: string
    metadata?: Record<string, unknown> | null
  } = {}

  if ("plan_name" in payload && payload.plan_name !== undefined) {
    normalized.plan_name = payload.plan_name
  }

  if ("status" in payload && payload.status !== undefined) {
    normalized.status = payload.status
  }

  if ("expires_at" in payload) {
    normalized.expires_at = parseNullableDate(payload.expires_at, "expires_at")
  }

  if ("next_billing_at" in payload) {
    normalized.next_billing_at = parseNullableDate(
      payload.next_billing_at,
      "next_billing_at"
    )
  }

  if ("billing_interval" in payload) {
    normalized.billing_interval = payload.billing_interval ?? null
  }

  if ("amount" in payload) {
    normalized.amount = payload.amount ?? null
  }

  if ("currency_code" in payload && payload.currency_code !== undefined) {
    normalized.currency_code = payload.currency_code
  }

  if ("metadata" in payload) {
    normalized.metadata = payload.metadata ?? null
  }

  return normalized
}

function parseRequiredDate(value?: string): Date | undefined {
  if (!value) {
    return undefined
  }

  return parseDateValue(value, "started_at")
}

function parseNullableDate(
  value: string | null | undefined,
  fieldName: string
): Date | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  return parseDateValue(value, fieldName)
}

function parseDateValue(value: string, fieldName: string): Date {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must be a valid date string`
    )
  }

  return date
}
