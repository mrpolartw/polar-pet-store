import type { MedusaRequest } from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

import type { CustomerGender } from "../../modules/membership/constants"
import {
  CUSTOMER_EMAIL_VERIFICATION_TTL_MS,
  CUSTOMER_PASSWORD_RESET_TTL_MS,
  getCustomerEmailVerificationUrl,
  getCustomerPasswordResetUrl,
} from "./config"
import {
  buildAuthInput,
  buildCustomerDisplayName,
  createCustomerAccountWithIdentity,
  ensureCustomerAuthIdentity,
  establishCustomerSession,
  findCustomerAuthIdentityByCustomerId,
  findCustomerAuthIdentityByEmail,
  findCustomerByEmail,
  getAuthService,
  getMembershipService,
  normalizeCustomerEmail,
  retrieveCustomerById,
  type RegisterCustomerPetInput,
} from "./helpers"
import {
  sendCustomerEmailVerificationEmail,
  sendCustomerPasswordResetEmail,
} from "./notification"
import { inspectCustomerAuthToken, issueCustomerAuthToken } from "./tokens"

export type CustomerLoginResult =
  | {
      success: true
      customer_id: string
    }
  | {
      success: false
      code:
        | "INVALID_CREDENTIALS"
        | "EMAIL_NOT_VERIFIED"
        | "ACCOUNT_INCOMPLETE"
      message: string
      email?: string
    }

export type RegisterCustomerEmailAccountInput = {
  email: string
  password: string
  name: string
  phone?: string | null
  birthday?: string | null
  gender?: CustomerGender
  pets?: RegisterCustomerPetInput[]
}

export type EmailVerificationStatus =
  | "verified"
  | "already_verified"
  | "invalid_token"
  | "token_expired"
  | "token_used"

export type PasswordResetTokenStatus =
  | "valid"
  | "invalid_token"
  | "token_expired"
  | "token_used"

export type CustomerRegisterEmailStatus =
  | "available"
  | "registered_verified"
  | "registered_unverified"

export async function requestCustomerEmailVerification(
  scope: MedusaContainer,
  email: string
): Promise<{
  sent: boolean
  email_verified: boolean
}> {
  const normalizedEmail = normalizeCustomerEmail(email)
  const membershipService = getMembershipService(scope)
  const customer = await findCustomerByEmail(scope, normalizedEmail)

  if (!customer) {
    return {
      sent: false,
      email_verified: false,
    }
  }

  const authIdentity = await ensureCustomerAuthIdentity(scope, customer)
  const profile = await membershipService.getCustomerProfile(customer.id)

  if (profile?.email_verified_at) {
    return {
      sent: false,
      email_verified: true,
    }
  }

  const { token } = await issueCustomerAuthToken(scope, {
    customerId: customer.id,
    authIdentityId: authIdentity.id,
    tokenType: "email_verification",
    expiresAt: new Date(Date.now() + CUSTOMER_EMAIL_VERIFICATION_TTL_MS),
    invalidateExisting: true,
    metadata: {
      email: normalizedEmail,
    },
  })

  await sendCustomerEmailVerificationEmail(scope, {
    to: normalizedEmail,
    verificationUrl: getCustomerEmailVerificationUrl(token),
  })

  return {
    sent: true,
    email_verified: false,
  }
}

export async function inspectCustomerRegisterEmailStatus(
  scope: MedusaContainer,
  email: string
): Promise<{
  status: CustomerRegisterEmailStatus
  email: string
  verification_sent: boolean
}> {
  const normalizedEmail = normalizeCustomerEmail(email)
  const membershipService = getMembershipService(scope)
  const existingCustomer = await findCustomerByEmail(scope, normalizedEmail)
  const existingAuthIdentity = await findCustomerAuthIdentityByEmail(
    scope,
    normalizedEmail
  )
  const linkedCustomerId =
    typeof existingAuthIdentity?.app_metadata?.customer_id === "string"
      ? existingAuthIdentity.app_metadata.customer_id
      : null

  if (!existingCustomer?.has_account && !linkedCustomerId) {
    return {
      status: "available",
      email: normalizedEmail,
      verification_sent: false,
    }
  }

  const customerId = linkedCustomerId ?? existingCustomer?.id ?? null
  const profile = customerId
    ? await membershipService.getCustomerProfile(customerId)
    : null

  if (profile?.email_verified_at) {
    return {
      status: "registered_verified",
      email: normalizedEmail,
      verification_sent: false,
    }
  }

  const verificationResult = await requestCustomerEmailVerification(
    scope,
    normalizedEmail
  )

  return {
    status: "registered_unverified",
    email: normalizedEmail,
    verification_sent: verificationResult.sent,
  }
}

export async function registerCustomerEmailAccount(
  scope: MedusaContainer,
  req: MedusaRequest,
  input: RegisterCustomerEmailAccountInput
): Promise<{
  customer_id: string
  email: string
  verification_sent: boolean
}> {
  const normalizedEmail = normalizeCustomerEmail(input.email)
  const authService = getAuthService(scope)
  const existingCustomer = await findCustomerByEmail(scope, normalizedEmail)
  const existingAuthIdentity = await findCustomerAuthIdentityByEmail(
    scope,
    normalizedEmail
  )
  const linkedCustomerId =
    typeof existingAuthIdentity?.app_metadata?.customer_id === "string"
      ? existingAuthIdentity.app_metadata.customer_id
      : null

  if (existingCustomer?.has_account || linkedCustomerId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "此 Email 已註冊，請直接登入或使用忘記密碼。"
    )
  }

  const { success, error, authIdentity } = await authService.register(
    "emailpass",
    buildAuthInput(req, {
      email: normalizedEmail,
      password: input.password,
    })
  )

  if (!success || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error || "註冊失敗，請稍後再試。"
    )
  }

  const customer = await createCustomerAccountWithIdentity(scope, {
    authIdentityId: authIdentity.id,
    existingCustomerId: existingCustomer?.id ?? null,
    email: normalizedEmail,
    name: input.name,
    phone: input.phone ?? null,
    birthday: input.birthday ?? null,
    gender: input.gender,
    emailVerifiedAt: null,
    pets: input.pets,
  })

  await requestCustomerEmailVerification(scope, normalizedEmail)

  await getMembershipService(scope).createAuditLog({
    actor_type: "customer",
    actor_id: customer.id,
    action: "customer.auth.registered",
    target_type: "customer",
    target_id: customer.id,
    after_state: {
      email: normalizedEmail,
      name: buildCustomerDisplayName(customer),
      email_verified: false,
    },
    metadata: {
      registration_method: "email_password",
      existing_customer_attached: Boolean(existingCustomer),
    },
  })

  return {
    customer_id: customer.id,
    email: normalizedEmail,
    verification_sent: true,
  }
}

export async function loginCustomerWithEmailPassword(
  scope: MedusaContainer,
  req: MedusaRequest,
  input: {
    email: string
    password: string
  }
): Promise<CustomerLoginResult> {
  const normalizedEmail = normalizeCustomerEmail(input.email)
  const authService = getAuthService(scope)
  const membershipService = getMembershipService(scope)
  const { success, authIdentity } = await authService.authenticate(
    "emailpass",
    buildAuthInput(req, {
      email: normalizedEmail,
      password: input.password,
    })
  )

  if (!success || !authIdentity) {
    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Email 或密碼錯誤。",
    }
  }

  const customerId =
    typeof authIdentity.app_metadata?.customer_id === "string"
      ? authIdentity.app_metadata.customer_id
      : null

  if (!customerId) {
    return {
      success: false,
      code: "ACCOUNT_INCOMPLETE",
      message: "帳號資料尚未完成，請聯絡客服協助處理。",
    }
  }

  const profile = await membershipService.getCustomerProfile(customerId)

  if (!profile?.email_verified_at) {
    return {
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "請先完成 Email 驗證後再登入。",
      email: normalizedEmail,
    }
  }

  establishCustomerSession(req, authIdentity, customerId, {
    email: normalizedEmail,
  })

  await membershipService.upsertCustomerProfile(customerId, {
    last_login_at: new Date(),
  })

  return {
    success: true,
    customer_id: customerId,
  }
}

export async function confirmCustomerEmailVerification(
  scope: MedusaContainer,
  token: string
): Promise<{
  status: EmailVerificationStatus
  customer_id: string | null
}> {
  const membershipService = getMembershipService(scope)
  const inspectedToken = await inspectCustomerAuthToken(scope, {
    token,
    tokenType: "email_verification",
  })

  if (!inspectedToken.tokenRecord) {
    return {
      status: "invalid_token",
      customer_id: null,
    }
  }

  const customerId = inspectedToken.tokenRecord.customer_id

  if (!customerId) {
    return {
      status: "invalid_token",
      customer_id: null,
    }
  }

  const profile = await membershipService.getCustomerProfile(customerId)

  if (profile?.email_verified_at) {
    return {
      status: "already_verified",
      customer_id: customerId,
    }
  }

  if (inspectedToken.status === "expired") {
    return {
      status: "token_expired",
      customer_id: customerId,
    }
  }

  if (inspectedToken.status === "used") {
    return {
      status: "token_used",
      customer_id: customerId,
    }
  }

  if (inspectedToken.status !== "valid") {
    return {
      status: "invalid_token",
      customer_id: customerId,
    }
  }

  await membershipService.upsertCustomerProfile(customerId, {
    email_verified_at: new Date(),
  })

  await membershipService.markCustomerAuthTokenUsed(
    inspectedToken.tokenRecord.id,
    {
      ...((inspectedToken.tokenRecord.metadata as Record<string, unknown>) ??
        {}),
      consumed_reason: "email_verified",
    }
  )

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.auth.email_verified",
    target_type: "customer",
    target_id: customerId,
    after_state: {
      email_verified: true,
    },
    metadata: {
      token_type: "email_verification",
    },
  })

  return {
    status: "verified",
    customer_id: customerId,
  }
}

export async function requestCustomerPasswordReset(
  scope: MedusaContainer,
  email: string
): Promise<void> {
  const normalizedEmail = normalizeCustomerEmail(email)
  const customer = await findCustomerByEmail(scope, normalizedEmail)

  if (!customer?.id) {
    return
  }

  const membershipService = getMembershipService(scope)
  const authIdentity = await findCustomerAuthIdentityByCustomerId(
    scope,
    customer.id
  )

  if (!authIdentity) {
    return
  }

  const { token } = await issueCustomerAuthToken(scope, {
    customerId: customer.id,
    authIdentityId: authIdentity.id,
    tokenType: "password_reset",
    expiresAt: new Date(Date.now() + CUSTOMER_PASSWORD_RESET_TTL_MS),
    invalidateExisting: true,
    metadata: {
      email: normalizedEmail,
    },
  })

  await sendCustomerPasswordResetEmail(scope, {
    to: normalizedEmail,
    resetUrl: getCustomerPasswordResetUrl(token),
  })

  await membershipService.createAuditLog({
    actor_type: "system",
    actor_id: "system",
    action: "customer.auth.password_reset_requested",
    target_type: "customer",
    target_id: customer.id,
    metadata: {
      email: normalizedEmail,
    },
  })
}

export async function inspectCustomerPasswordResetToken(
  scope: MedusaContainer,
  token: string
): Promise<{
  status: PasswordResetTokenStatus
  customer_id: string | null
}> {
  const inspectedToken = await inspectCustomerAuthToken(scope, {
    token,
    tokenType: "password_reset",
  })

  if (!inspectedToken.tokenRecord?.customer_id) {
    return {
      status: "invalid_token",
      customer_id: null,
    }
  }

  if (inspectedToken.status === "expired") {
    return {
      status: "token_expired",
      customer_id: inspectedToken.tokenRecord.customer_id,
    }
  }

  if (inspectedToken.status === "used") {
    return {
      status: "token_used",
      customer_id: inspectedToken.tokenRecord.customer_id,
    }
  }

  if (inspectedToken.status !== "valid") {
    return {
      status: "invalid_token",
      customer_id: inspectedToken.tokenRecord.customer_id,
    }
  }

  return {
    status: "valid",
    customer_id: inspectedToken.tokenRecord.customer_id,
  }
}

export async function confirmCustomerPasswordReset(
  scope: MedusaContainer,
  input: {
    token: string
    password: string
  }
): Promise<{
  status: Exclude<PasswordResetTokenStatus, "valid"> | "reset"
  customer_id: string | null
}> {
  const membershipService = getMembershipService(scope)
  const tokenState = await inspectCustomerAuthToken(scope, {
    token: input.token,
    tokenType: "password_reset",
  })

  if (!tokenState.tokenRecord?.customer_id) {
    return {
      status: "invalid_token",
      customer_id: null,
    }
  }

  if (tokenState.status === "expired") {
    return {
      status: "token_expired",
      customer_id: tokenState.tokenRecord.customer_id,
    }
  }

  if (tokenState.status === "used") {
    return {
      status: "token_used",
      customer_id: tokenState.tokenRecord.customer_id,
    }
  }

  if (tokenState.status !== "valid") {
    return {
      status: "invalid_token",
      customer_id: tokenState.tokenRecord.customer_id,
    }
  }

  const customer = await retrieveCustomerById(
    scope,
    tokenState.tokenRecord.customer_id
  )
  const normalizedEmail =
    typeof tokenState.tokenRecord.metadata?.["email"] === "string"
      ? normalizeCustomerEmail(
          String(tokenState.tokenRecord.metadata?.["email"])
        )
      : normalizeCustomerEmail(customer.email ?? "")

  if (!normalizedEmail) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "找不到可重設密碼的 Email，請重新申請重設密碼。"
    )
  }

  const authService = getAuthService(scope)
  const { success, error } = await authService.updateProvider("emailpass", {
    entity_id: normalizedEmail,
    email: normalizedEmail,
    password: input.password,
  })

  if (!success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error || "重設密碼失敗，請稍後再試。"
    )
  }

  await membershipService.markCustomerAuthTokenUsed(tokenState.tokenRecord.id, {
    ...((tokenState.tokenRecord.metadata as Record<string, unknown>) ?? {}),
    consumed_reason: "password_reset",
  })

  await membershipService.invalidateCustomerAuthTokens(
    {
      customer_id: tokenState.tokenRecord.customer_id,
      token_type: "password_reset",
    },
    {
      invalidated_reason: "password_reset_completed",
    }
  )

  await membershipService.createAuditLog({
    actor_type: "system",
    actor_id: "system",
    action: "customer.auth.password_reset_completed",
    target_type: "customer",
    target_id: tokenState.tokenRecord.customer_id,
  })

  return {
    status: "reset",
    customer_id: tokenState.tokenRecord.customer_id,
  }
}
