import type {
  ICustomerModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type {
  AdminCustomerMembershipDetail,
  AdminUpdateCustomerMembershipRequest,
} from "./customer-membership-detail"
import {
  formatDateOnly,
  formatDateTimeString,
} from "./customer-membership-detail"
import type { CustomerGender } from "./customer-gender"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import type MembershipModuleService from "../../modules/membership/service"
import { retrieveCustomerWithMembershipLevel } from "./customer-membership"
import { retrieveCustomerMembershipLevelComputation } from "./customer-membership-level"
import type { MembershipPointsSnapshot } from "./membership-point-balance"

type CustomerMembershipRecord = NonNullable<
  Awaited<ReturnType<typeof retrieveCustomerWithMembershipLevel>>
>
type MembershipCustomerProfileRecord = NonNullable<
  Awaited<ReturnType<MembershipModuleService["getCustomerProfile"]>>
>

type UpdateAdminCustomerMembershipInput = {
  customerId: string
  actorId: string
  ipAddress?: string | null
  payload: AdminUpdateCustomerMembershipRequest
}

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getCustomerService(scope: MedusaContainer): ICustomerModuleService {
  return scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
}

async function ensureCustomerMembership(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerMembershipRecord> {
  const customer = await retrieveCustomerWithMembershipLevel(scope, customerId)

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${customerId} was not found`
    )
  }

  return customer as CustomerMembershipRecord
}
function buildMembershipDetailRecord(input: {
  customer: CustomerMembershipRecord
  profile: MembershipCustomerProfileRecord | null
  pointSummary: MembershipPointsSnapshot
  membershipLevelComputation: Awaited<
    ReturnType<typeof retrieveCustomerMembershipLevelComputation>
  >
}): AdminCustomerMembershipDetail {
  return {
    customer_id: input.customer.id,
    phone: input.customer.phone ?? null,
    birthday: formatDateOnly(input.profile?.birthday),
    gender: (input.profile?.gender ?? "undisclosed") as CustomerGender,
    last_login_at: formatDateTimeString(input.profile?.last_login_at),
    summary: {
      points: input.pointSummary.available_points,
      total_points: input.pointSummary.total_points,
      available_points: input.pointSummary.available_points,
      expired_points: input.pointSummary.expired_points,
      redeemed_points: input.pointSummary.redeemed_points,
      refunded_points: input.pointSummary.refunded_points,
      total_spent: input.membershipLevelComputation.total_spent,
      yearly_spent: input.membershipLevelComputation.yearly_spent,
      currency_code: input.membershipLevelComputation.currency_code,
      joined_at: formatDateTimeString(input.customer.created_at),
      current_level: input.membershipLevelComputation.current_level,
    },
  }
}

function parseMembershipDateInput(
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

function normalizeProfileUpdatePayload(
  payload: AdminUpdateCustomerMembershipRequest
): {
  birthday?: Date | null
  gender?: CustomerGender
} {
  const normalized: {
    birthday?: Date | null
    gender?: CustomerGender
  } = {}

  if ("birthday" in payload) {
    normalized.birthday = parseMembershipDateInput(payload.birthday, "birthday")
  }

  if ("gender" in payload && payload.gender !== undefined) {
    normalized.gender = payload.gender
  }

  return normalized
}

function getAuditSnapshot(detail: AdminCustomerMembershipDetail) {
  return {
    phone: detail.phone,
    birthday: detail.birthday,
    gender: detail.gender,
  }
}

function getChangedFields(
  before: ReturnType<typeof getAuditSnapshot>,
  after: ReturnType<typeof getAuditSnapshot>
): string[] {
  return (Object.keys(before) as Array<keyof typeof before>).filter(
    (field) => before[field] !== after[field]
  )
}

export async function retrieveAdminCustomerMembershipDetail(
  scope: MedusaContainer,
  customerId: string
): Promise<AdminCustomerMembershipDetail> {
  const membershipService = getMembershipService(scope)
  const customer = await ensureCustomerMembership(scope, customerId)
  const [profile, points, membershipLevelComputation] = await Promise.all([
    membershipService.getCustomerProfile(customerId),
    membershipService.getCustomerPoints(customerId),
    retrieveCustomerMembershipLevelComputation(scope, customerId),
  ])

  return buildMembershipDetailRecord({
    customer,
    profile,
    pointSummary: points.summary,
    membershipLevelComputation,
  })
}

export async function updateAdminCustomerMembership(
  scope: MedusaContainer,
  input: UpdateAdminCustomerMembershipInput
): Promise<AdminCustomerMembershipDetail> {
  const membershipService = getMembershipService(scope)
  const customerService = getCustomerService(scope)
  const before = await retrieveAdminCustomerMembershipDetail(
    scope,
    input.customerId
  )

  if ("phone" in input.payload) {
    await customerService.updateCustomers(input.customerId, {
      phone: input.payload.phone ?? null,
    })
  }

  const normalizedProfile = normalizeProfileUpdatePayload(input.payload)

  if (Object.keys(normalizedProfile).length > 0) {
    await membershipService.upsertCustomerProfile(
      input.customerId,
      normalizedProfile
    )
  }

  const after = await retrieveAdminCustomerMembershipDetail(
    scope,
    input.customerId
  )

  await membershipService.createAuditLog({
    actor_type: "admin",
    actor_id: input.actorId,
    action: "customer.membership_profile.updated",
    target_type: "customer",
    target_id: input.customerId,
    before_state: getAuditSnapshot(before),
    after_state: getAuditSnapshot(after),
    ip_address: input.ipAddress ?? null,
    metadata: {
      changed_fields: getChangedFields(
        getAuditSnapshot(before),
        getAuditSnapshot(after)
      ),
      source: "admin_customer_membership_widget",
    },
  })

  return after
}
