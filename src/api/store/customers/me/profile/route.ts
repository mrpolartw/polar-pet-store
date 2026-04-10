import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  buildCustomerDisplayName,
  getCustomerService,
  getMembershipService,
  retrieveCustomerById,
  splitCustomerName,
} from "../../../../../lib/customer-auth/helpers"
import type { StoreCustomerProfileResponse } from "../../../customer-auth/types"
import type { StoreCustomerProfileUpdateType } from "../../../customer-auth/validators"
import type { CustomerGender } from "../../../../../modules/membership/constants"

function formatDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const normalized = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(normalized.getTime())) {
    return null
  }

  return normalized.toISOString().slice(0, 10)
}

function parseDateOnly(
  value: string | null | undefined,
  fieldName: string
): Date | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must be a valid date`
    )
  }

  const normalized = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(normalized.getTime()) ||
    normalized.toISOString().slice(0, 10) !== value
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${fieldName} must be a valid date`
    )
  }

  return normalized
}

function getAvatarValue(metadata: Record<string, unknown> | null | undefined) {
  return typeof metadata?.avatar === "string" ? metadata.avatar : null
}

function toCustomerProfileResponse(input: {
  customer: Awaited<ReturnType<typeof retrieveCustomerById>>
  profile: Awaited<ReturnType<ReturnType<typeof getMembershipService>["getCustomerProfile"]>>
}): StoreCustomerProfileResponse {
  const metadata =
    input.customer.metadata &&
    typeof input.customer.metadata === "object" &&
    !Array.isArray(input.customer.metadata)
      ? (input.customer.metadata as Record<string, unknown>)
      : null

  return {
    customer: {
      ...input.customer,
      metadata,
      name: buildCustomerDisplayName(input.customer),
      birthday: formatDateOnly(input.profile?.birthday),
      gender: (input.profile?.gender ?? "undisclosed") as
        | "male"
        | "female"
        | "undisclosed",
      avatar: getAvatarValue(metadata),
    },
  }
}

function getAuditSnapshot(input: StoreCustomerProfileResponse["customer"]) {
  return {
    name: input.name,
    phone: input.phone ?? null,
    birthday: input.birthday,
    gender: input.gender,
    avatar: input.avatar,
  }
}

function getChangedFields(
  before: ReturnType<typeof getAuditSnapshot>,
  after: ReturnType<typeof getAuditSnapshot>
) {
  return (Object.keys(before) as Array<keyof typeof before>).filter(
    (field) => before[field] !== after[field]
  )
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerProfileResponse>
): Promise<void> {
  const customerId = req.auth_context.actor_id
  const membershipService = getMembershipService(req.scope)
  const [customer, profile] = await Promise.all([
    retrieveCustomerById(req.scope, customerId),
    membershipService.getCustomerProfile(customerId),
  ])

  res.json(
    toCustomerProfileResponse({
      customer,
      profile,
    })
  )
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCustomerProfileUpdateType>,
  res: MedusaResponse<StoreCustomerProfileResponse>
): Promise<void> {
  const customerId = req.auth_context.actor_id
  const customerService = getCustomerService(req.scope)
  const membershipService = getMembershipService(req.scope)

  const [currentCustomer, currentProfile] = await Promise.all([
    retrieveCustomerById(req.scope, customerId),
    membershipService.getCustomerProfile(customerId),
  ])

  const before = toCustomerProfileResponse({
    customer: currentCustomer,
    profile: currentProfile,
  })

  const customerUpdate: Record<string, unknown> = {}

  if (
    "name" in req.validatedBody &&
    req.validatedBody.name !== undefined &&
    req.validatedBody.name !== null
  ) {
    const splitName = splitCustomerName(req.validatedBody.name)
    customerUpdate.first_name = splitName.first_name || null
    customerUpdate.last_name = splitName.last_name || null
  }

  if ("phone" in req.validatedBody) {
    customerUpdate.phone = req.validatedBody.phone ?? null
  }

  if ("avatar" in req.validatedBody) {
    const metadata =
      currentCustomer.metadata &&
      typeof currentCustomer.metadata === "object" &&
      !Array.isArray(currentCustomer.metadata)
        ? { ...(currentCustomer.metadata as Record<string, unknown>) }
        : {}

    if (req.validatedBody.avatar) {
      metadata.avatar = req.validatedBody.avatar
    } else {
      delete metadata.avatar
    }

    customerUpdate.metadata = metadata
  }

  if (Object.keys(customerUpdate).length > 0) {
    await customerService.updateCustomers(customerId, customerUpdate)
  }

  const profileUpdate: {
    birthday?: Date | null
    gender?: CustomerGender
  } = {}

  if ("birthday" in req.validatedBody) {
    profileUpdate.birthday = parseDateOnly(
      req.validatedBody.birthday,
      "birthday"
    )
  }

  if ("gender" in req.validatedBody && req.validatedBody.gender !== undefined) {
    profileUpdate.gender = req.validatedBody.gender as CustomerGender
  }

  if (Object.keys(profileUpdate).length > 0) {
    await membershipService.upsertCustomerProfile(customerId, profileUpdate)
  }

  const [nextCustomer, nextProfile] = await Promise.all([
    retrieveCustomerById(req.scope, customerId),
    membershipService.getCustomerProfile(customerId),
  ])

  const after = toCustomerProfileResponse({
    customer: nextCustomer,
    profile: nextProfile,
  })

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.profile.updated",
    target_type: "customer",
    target_id: customerId,
    before_state: getAuditSnapshot(before.customer),
    after_state: getAuditSnapshot(after.customer),
    ip_address: req.ip ?? null,
    metadata: {
      changed_fields: getChangedFields(
        getAuditSnapshot(before.customer),
        getAuditSnapshot(after.customer)
      ),
      source: "store_customer_profile_route",
    },
  })

  res.json(after)
}
