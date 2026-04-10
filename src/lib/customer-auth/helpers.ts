import { randomBytes } from "crypto"

import { createCustomerAccountWorkflow } from "@medusajs/core-flows"
import type { MedusaRequest } from "@medusajs/framework/http"
import type {
  AuthIdentityDTO,
  CustomerDTO,
  IAuthModuleService,
  ICustomerModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import type { AuthenticationInput } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { MEMBERSHIP_MODULE } from "../../modules/membership"
import type { CustomerGender } from "../../modules/membership/constants"
import type MembershipModuleService from "../../modules/membership/service"

export type RegisterCustomerPetInput = {
  name: string
  species?: "dog" | "cat" | "bird" | "other" | null
  breed?: string | null
  birthday?: string | null
  gender?: "male" | "female" | "unknown"
  metadata?: Record<string, unknown> | null
}

type CustomerSessionRequest = MedusaRequest & {
  session: {
    auth_context?: Record<string, unknown>
  }
}

type CreateCustomerAccountWithIdentityInput = {
  authIdentityId: string
  existingCustomerId?: string | null
  email: string
  name: string
  phone?: string | null
  birthday?: string | null
  gender?: CustomerGender
  emailVerifiedAt?: Date | null
  pets?: RegisterCustomerPetInput[]
}

function normalizeRecordToStrings(
  input: Record<string, unknown> | undefined
): Record<string, string> {
  if (!input) {
    return {}
  }

  return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc
    }

    if (Array.isArray(value)) {
      const [first] = value

      if (first !== undefined && first !== null) {
        acc[key] = String(first)
      }

      return acc
    }

    acc[key] = String(value)
    return acc
  }, {})
}

export function normalizeCustomerEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function splitCustomerName(name: string): {
  first_name: string
  last_name: string
} {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return {
      first_name: "",
      last_name: "",
    }
  }

  const parts = trimmedName.split(/\s+/)
  const [firstName, ...rest] = parts

  return {
    first_name: firstName,
    last_name: rest.join(" "),
  }
}

export function buildAuthInput(
  req: MedusaRequest,
  body: Record<string, string>
): AuthenticationInput {
  return {
    url: req.url,
    headers: normalizeRecordToStrings(req.headers as Record<string, unknown>),
    query: normalizeRecordToStrings(req.query as Record<string, unknown>),
    body: normalizeRecordToStrings(body),
    protocol: req.protocol,
  }
}

export function getAuthService(scope: MedusaContainer): IAuthModuleService {
  return scope.resolve<IAuthModuleService>(Modules.AUTH)
}

export function getCustomerService(
  scope: MedusaContainer
): ICustomerModuleService {
  return scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
}

export function getMembershipService(
  scope: MedusaContainer
): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

export async function findCustomerByEmail(
  scope: MedusaContainer,
  email: string
): Promise<CustomerDTO | null> {
  const customerService = getCustomerService(scope)
  const [customer] = await customerService.listCustomers(
    {
      email: normalizeCustomerEmail(email),
    },
    {
      take: 1,
    }
  )

  return customer ?? null
}

export async function retrieveCustomerById(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerDTO> {
  return await getCustomerService(scope).retrieveCustomer(customerId)
}

export async function findCustomerAuthIdentityByCustomerId(
  scope: MedusaContainer,
  customerId: string
): Promise<AuthIdentityDTO | null> {
  const authService = getAuthService(scope)
  const [authIdentity] = await authService.listAuthIdentities(
    {
      app_metadata: {
        customer_id: customerId,
      },
    },
    {
      take: 1,
    }
  )

  return authIdentity ?? null
}

export async function findCustomerAuthIdentityByEmail(
  scope: MedusaContainer,
  email: string
): Promise<AuthIdentityDTO | null> {
  const authService = getAuthService(scope)
  const [authIdentity] = await authService.listAuthIdentities(
    {
      provider_identities: {
        provider: "emailpass",
        entity_id: normalizeCustomerEmail(email),
      },
    },
    {
      take: 1,
    }
  )

  return authIdentity ?? null
}

export async function ensureCustomerAuthIdentity(
  scope: MedusaContainer,
  customer: CustomerDTO
): Promise<AuthIdentityDTO> {
  const currentAuthIdentity = await findCustomerAuthIdentityByCustomerId(
    scope,
    customer.id
  )

  if (currentAuthIdentity) {
    return currentAuthIdentity
  }

  const normalizedEmail = normalizeCustomerEmail(customer.email ?? "")

  if (!normalizedEmail) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "既有顧客缺少 Email，無法建立登入身分。"
    )
  }

  const authService = getAuthService(scope)
  const existingAuthIdentity = await findCustomerAuthIdentityByEmail(
    scope,
    normalizedEmail
  )

  if (existingAuthIdentity) {
    const linkedCustomerId =
      typeof existingAuthIdentity.app_metadata?.customer_id === "string"
        ? existingAuthIdentity.app_metadata.customer_id
        : null

    if (linkedCustomerId && linkedCustomerId !== customer.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "這個 Email 已綁定其他會員帳號。"
      )
    }

    return await authService.updateAuthIdentities({
      id: existingAuthIdentity.id,
      app_metadata: {
        ...(existingAuthIdentity.app_metadata ?? {}),
        customer_id: customer.id,
      },
    })
  }

  const tempPassword = randomBytes(24).toString("base64url")
  const { success, error, authIdentity } = await authService.register(
    "emailpass",
    {
      url: "",
      headers: {},
      query: {},
      body: {
        email: normalizedEmail,
        password: tempPassword,
      },
      protocol: "https",
    }
  )

  if (!success || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error || "建立會員登入身分失敗。"
    )
  }

  return await authService.updateAuthIdentities({
    id: authIdentity.id,
    app_metadata: {
      ...(authIdentity.app_metadata ?? {}),
      customer_id: customer.id,
    },
  })
}

async function attachAuthIdentityToExistingCustomer(
  scope: MedusaContainer,
  input: CreateCustomerAccountWithIdentityInput & {
    existingCustomerId: string
  }
): Promise<CustomerDTO> {
  const customerService = getCustomerService(scope)
  const authService = getAuthService(scope)
  const membershipService = getMembershipService(scope)
  const name = splitCustomerName(input.name)
  const normalizedEmail = normalizeCustomerEmail(input.email)

  await authService.updateAuthIdentities({
    id: input.authIdentityId,
    app_metadata: {
      customer_id: input.existingCustomerId,
    },
  })

  await customerService.updateCustomers(input.existingCustomerId, {
    email: normalizedEmail,
    phone: input.phone ?? null,
    first_name: name.first_name || null,
    last_name: name.last_name || null,
  })

  await membershipService.upsertCustomerProfile(input.existingCustomerId, {
    birthday: input.birthday ? new Date(input.birthday) : null,
    gender: input.gender ?? "undisclosed",
    email_verified_at: input.emailVerifiedAt ?? null,
  })

  if (input.pets?.length) {
    for (const pet of input.pets) {
      await membershipService.createPet(input.existingCustomerId, {
        name: pet.name,
        species: pet.species ?? null,
        breed: pet.breed ?? null,
        birthday: pet.birthday ? new Date(pet.birthday) : null,
        gender: pet.gender,
        metadata: pet.metadata ?? null,
      })
    }
  }

  return await customerService.retrieveCustomer(input.existingCustomerId)
}

export async function createCustomerAccountWithIdentity(
  scope: MedusaContainer,
  input: CreateCustomerAccountWithIdentityInput
): Promise<CustomerDTO> {
  if (input.existingCustomerId) {
    return await attachAuthIdentityToExistingCustomer(scope, {
      ...input,
      existingCustomerId: input.existingCustomerId,
    })
  }

  const workflow = createCustomerAccountWorkflow(scope)
  const membershipService = getMembershipService(scope)
  const customerService = getCustomerService(scope)
  const name = splitCustomerName(input.name)
  const normalizedEmail = normalizeCustomerEmail(input.email)

  const { result } = await workflow.run({
    input: {
      authIdentityId: input.authIdentityId,
      customerData: {
        email: normalizedEmail,
        phone: input.phone ?? undefined,
        first_name: name.first_name,
        last_name: name.last_name || undefined,
      },
    },
  })

  await membershipService.upsertCustomerProfile(result.id, {
    birthday: input.birthday ? new Date(input.birthday) : null,
    gender: input.gender ?? "undisclosed",
    email_verified_at: input.emailVerifiedAt ?? null,
  })

  if (input.pets?.length) {
    for (const pet of input.pets) {
      await membershipService.createPet(result.id, {
        name: pet.name,
        species: pet.species ?? null,
        breed: pet.breed ?? null,
        birthday: pet.birthday ? new Date(pet.birthday) : null,
        gender: pet.gender,
        metadata: pet.metadata ?? null,
      })
    }
  }

  return await customerService.retrieveCustomer(result.id)
}

export function buildCustomerSessionContext(
  authIdentity: AuthIdentityDTO,
  customerId: string,
  userMetadata: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    actor_id: customerId,
    actor_type: "customer",
    auth_identity_id: authIdentity.id,
    app_metadata: {
      ...(authIdentity.app_metadata ?? {}),
      customer_id: customerId,
    },
    user_metadata: userMetadata,
  }
}

export function establishCustomerSession(
  req: MedusaRequest,
  authIdentity: AuthIdentityDTO,
  customerId: string,
  userMetadata: Record<string, unknown> = {}
): void {
  ;(req as CustomerSessionRequest).session.auth_context =
    buildCustomerSessionContext(authIdentity, customerId, userMetadata)
}

export function buildCustomerDisplayName(customer: CustomerDTO): string {
  const firstName = customer.first_name?.trim() ?? ""
  const lastName = customer.last_name?.trim() ?? ""
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || customer.email || "會員"
}
