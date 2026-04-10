import { randomUUID } from "crypto"

import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

import {
  CUSTOMER_LINE_PENDING_EMAIL_TTL_MS,
  CUSTOMER_LINE_STATE_TTL_MS,
  buildStorefrontUrl,
  getLineOAuthConfig,
  sanitizeStorefrontRedirect,
} from "./config"
import {
  buildCustomerDisplayName,
  createCustomerAccountWithIdentity,
  ensureCustomerAuthIdentity,
  findCustomerByEmail,
  getAuthService,
  getMembershipService,
  normalizeCustomerEmail,
  retrieveCustomerById,
} from "./helpers"
import { inspectCustomerAuthToken, issueCustomerAuthToken } from "./tokens"

type LineTokenResponse = {
  access_token: string
  expires_in: number
  id_token?: string
  refresh_token?: string
  scope?: string
  token_type?: string
}

export type LineCustomerProfile = {
  provider_user_id: string
  display_name: string
  picture_url: string | null
  email: string | null
}

type LineStartMode = "login" | "bind"

export type LineAuthResolutionResult =
  | {
      status: "authenticated"
      customer_id: string
      auth_identity_id: string
      redirect_to: string
      user_metadata: Record<string, unknown>
    }
  | {
      status: "pending_email"
      redirect_to: string
      pending_token: string
    }

type PendingLineEmailPayload = {
  profile: LineCustomerProfile
  redirect_to: string
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init)

  if (!response.ok) {
    const errorBody = await response.text()

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      errorBody || "LINE OAuth 驗證失敗。"
    )
  }

  return (await response.json()) as T
}

function toLineTokenExpiresAt(
  expiresIn: number | undefined
): Date | null {
  if (typeof expiresIn !== "number" || Number.isNaN(expiresIn)) {
    return null
  }

  return new Date(Date.now() + expiresIn * 1000)
}

function getPendingLinePayload(
  tokenMetadata: unknown
): PendingLineEmailPayload | null {
  if (!tokenMetadata || typeof tokenMetadata !== "object") {
    return null
  }

  const payload = tokenMetadata as Record<string, unknown>
  const profile =
    payload.profile && typeof payload.profile === "object"
      ? (payload.profile as LineCustomerProfile)
      : null

  if (!profile?.provider_user_id) {
    return null
  }

  return {
    profile,
    redirect_to:
      typeof payload.redirect_to === "string"
        ? payload.redirect_to
        : sanitizeStorefrontRedirect(undefined, "account"),
    access_token:
      typeof payload.access_token === "string" ? payload.access_token : null,
    refresh_token:
      typeof payload.refresh_token === "string" ? payload.refresh_token : null,
    token_expires_at:
      typeof payload.token_expires_at === "string"
        ? payload.token_expires_at
        : null,
  }
}

export async function exchangeLineAuthorizationCode(
  code: string
): Promise<LineTokenResponse> {
  const config = getLineOAuthConfig()
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.callbackUrl,
    client_id: config.channelId,
    client_secret: config.channelSecret,
  })

  return await fetchJson<LineTokenResponse>(
    "https://api.line.me/oauth2/v2.1/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  )
}

export async function verifyLineIdToken(
  idToken: string
): Promise<LineCustomerProfile> {
  const config = getLineOAuthConfig()
  const body = new URLSearchParams({
    id_token: idToken,
    client_id: config.channelId,
  })

  const response = await fetchJson<{
    sub: string
    name?: string
    picture?: string
    email?: string
  }>("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  return {
    provider_user_id: response.sub,
    display_name: response.name || "LINE 會員",
    picture_url: response.picture ?? null,
    email: response.email ? normalizeCustomerEmail(response.email) : null,
  }
}

export async function issueLineOAuthStateToken(
  scope: MedusaContainer,
  input: {
    mode: LineStartMode
    redirectTo?: string
    customerId?: string
  }
): Promise<{
  stateToken: string
  authorizationUrl: string
}> {
  const config = getLineOAuthConfig()
  const redirectTo = sanitizeStorefrontRedirect(
    input.redirectTo,
    "account"
  )
  const { token: stateToken } = await issueCustomerAuthToken(scope, {
    customerId: input.customerId ?? null,
    tokenType: "line_oauth_state",
    expiresAt: new Date(Date.now() + CUSTOMER_LINE_STATE_TTL_MS),
    metadata: {
      mode: input.mode,
      redirect_to: redirectTo,
    },
  })

  const authorizationUrl = new URL(
    "https://access.line.me/oauth2/v2.1/authorize"
  )

  authorizationUrl.searchParams.set("response_type", "code")
  authorizationUrl.searchParams.set("client_id", config.channelId)
  authorizationUrl.searchParams.set("redirect_uri", config.callbackUrl)
  authorizationUrl.searchParams.set("state", stateToken)
  authorizationUrl.searchParams.set("scope", "profile openid email")

  return {
    stateToken,
    authorizationUrl: authorizationUrl.toString(),
  }
}

async function linkLineOAuthForCustomer(
  scope: MedusaContainer,
  input: {
    customerId: string
    profile: LineCustomerProfile
    accessToken: string | null
    refreshToken: string | null
    expiresAt: Date | null
    emailVerifiedAt?: Date | null
  }
): Promise<{
  customer_id: string
  auth_identity_id: string
  user_metadata: Record<string, unknown>
}> {
  const membershipService = getMembershipService(scope)
  const customer = await retrieveCustomerById(scope, input.customerId)
  const authIdentity = await ensureCustomerAuthIdentity(scope, customer)
  const [existingLink] = await membershipService.listOAuthLinks(
    {
      customer_id: input.customerId,
      provider: "line",
    },
    {
      take: 1,
    }
  )

  await membershipService.linkOAuth(
    input.customerId,
    "line",
    input.profile.provider_user_id,
    {
      provider_email: input.profile.email,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      token_expires_at: input.expiresAt,
    },
    {
      display_name: input.profile.display_name,
      picture_url: input.profile.picture_url,
      email: input.profile.email,
    }
  )

  await membershipService.upsertCustomerProfile(input.customerId, {
    email_verified_at: input.emailVerifiedAt ?? undefined,
    last_login_at: new Date(),
  })

  if (!existingLink) {
    await membershipService.createAuditLog({
      actor_type: "customer",
      actor_id: input.customerId,
      action: "customer.auth.line_linked",
      target_type: "customer",
      target_id: input.customerId,
      metadata: {
        provider_user_id: input.profile.provider_user_id,
        display_name: input.profile.display_name,
      },
    })
  }

  return {
    customer_id: input.customerId,
    auth_identity_id: authIdentity.id,
    user_metadata: {
      email: input.profile.email ?? customer.email,
      name: input.profile.display_name || buildCustomerDisplayName(customer),
      picture: input.profile.picture_url,
      auth_provider: "line",
    },
  }
}

export async function resolveLineCustomerAuthentication(
  scope: MedusaContainer,
  input: {
    code: string
    state: string
  }
): Promise<LineAuthResolutionResult> {
  const membershipService = getMembershipService(scope)
  const stateToken = await inspectCustomerAuthToken(scope, {
    token: input.state,
    tokenType: "line_oauth_state",
  })

  if (!stateToken.tokenRecord) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "LINE 登入狀態無效，請重新操作。"
    )
  }

  if (stateToken.status === "expired" || stateToken.status === "used") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "LINE 登入狀態已失效，請重新操作。"
    )
  }

  const tokenPayload =
    (stateToken.tokenRecord.metadata as Record<string, unknown> | null) ?? {}
  const mode = tokenPayload.mode === "bind" ? "bind" : "login"
  const redirectTo =
    typeof tokenPayload.redirect_to === "string"
      ? tokenPayload.redirect_to
      : sanitizeStorefrontRedirect(undefined, "account")

  const tokenResponse = await exchangeLineAuthorizationCode(input.code)

  if (!tokenResponse.id_token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "LINE 未回傳可用的登入資訊。"
    )
  }

  const lineProfile = await verifyLineIdToken(tokenResponse.id_token)
  const oauthCustomerId = await membershipService.findCustomerByOAuth(
    "line",
    lineProfile.provider_user_id
  )
  const tokenExpiresAt = toLineTokenExpiresAt(tokenResponse.expires_in)

  await membershipService.markCustomerAuthTokenUsed(stateToken.tokenRecord.id, {
    ...(tokenPayload ?? {}),
    consumed_reason: "line_callback",
  })

  if (mode === "bind") {
    const targetCustomerId = stateToken.tokenRecord.customer_id

    if (!targetCustomerId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "LINE 綁定流程缺少會員資料。"
      )
    }

    if (oauthCustomerId && oauthCustomerId !== targetCustomerId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "這個 LINE 帳號已綁定其他會員。"
      )
    }

    const linkedResult = await linkLineOAuthForCustomer(scope, {
      customerId: targetCustomerId,
      profile: lineProfile,
      accessToken: tokenResponse.access_token ?? null,
      refreshToken: tokenResponse.refresh_token ?? null,
      expiresAt: tokenExpiresAt,
      emailVerifiedAt: new Date(),
    })

    return {
      status: "authenticated",
      customer_id: linkedResult.customer_id,
      auth_identity_id: linkedResult.auth_identity_id,
      user_metadata: linkedResult.user_metadata,
      redirect_to: redirectTo,
    }
  }

  if (oauthCustomerId) {
    const linkedResult = await linkLineOAuthForCustomer(scope, {
      customerId: oauthCustomerId,
      profile: lineProfile,
      accessToken: tokenResponse.access_token ?? null,
      refreshToken: tokenResponse.refresh_token ?? null,
      expiresAt: tokenExpiresAt,
      emailVerifiedAt: new Date(),
    })

    return {
      status: "authenticated",
      customer_id: linkedResult.customer_id,
      auth_identity_id: linkedResult.auth_identity_id,
      user_metadata: linkedResult.user_metadata,
      redirect_to: redirectTo,
    }
  }

  if (!lineProfile.email) {
    const { token: pendingToken } = await issueCustomerAuthToken(scope, {
      tokenType: "line_pending_email",
      expiresAt: new Date(Date.now() + CUSTOMER_LINE_PENDING_EMAIL_TTL_MS),
      metadata: {
        profile: lineProfile,
        redirect_to: redirectTo,
        access_token: tokenResponse.access_token ?? null,
        refresh_token: tokenResponse.refresh_token ?? null,
        token_expires_at: tokenExpiresAt?.toISOString() ?? null,
      },
    })

    return {
      status: "pending_email",
      pending_token: pendingToken,
      redirect_to: buildStorefrontUrl("line-complete", {
        token: pendingToken,
      }),
    }
  }

  const existingCustomer = await findCustomerByEmail(scope, lineProfile.email)

  if (existingCustomer) {
    const linkedResult = await linkLineOAuthForCustomer(scope, {
      customerId: existingCustomer.id,
      profile: lineProfile,
      accessToken: tokenResponse.access_token ?? null,
      refreshToken: tokenResponse.refresh_token ?? null,
      expiresAt: tokenExpiresAt,
      emailVerifiedAt: new Date(),
    })

    return {
      status: "authenticated",
      customer_id: linkedResult.customer_id,
      auth_identity_id: linkedResult.auth_identity_id,
      user_metadata: linkedResult.user_metadata,
      redirect_to: redirectTo,
    }
  }

  const authService = getAuthService(scope)
  const randomPassword = randomUUID()
  const { success, error, authIdentity } = await authService.register(
    "emailpass",
    {
      url: "",
      headers: {},
      query: {},
      body: {
        email: lineProfile.email,
        password: randomPassword,
      },
      protocol: "https",
    }
  )

  if (!success || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error || "建立 LINE 會員帳號失敗。"
    )
  }

  const createdCustomer = await createCustomerAccountWithIdentity(scope, {
    authIdentityId: authIdentity.id,
    email: lineProfile.email,
    name: lineProfile.display_name,
    emailVerifiedAt: new Date(),
  })

  const linkedResult = await linkLineOAuthForCustomer(scope, {
    customerId: createdCustomer.id,
    profile: lineProfile,
    accessToken: tokenResponse.access_token ?? null,
    refreshToken: tokenResponse.refresh_token ?? null,
    expiresAt: tokenExpiresAt,
    emailVerifiedAt: new Date(),
  })

  return {
    status: "authenticated",
    customer_id: linkedResult.customer_id,
    auth_identity_id: linkedResult.auth_identity_id,
    user_metadata: linkedResult.user_metadata,
    redirect_to: redirectTo,
  }
}

export async function completeLineCustomerRegistration(
  scope: MedusaContainer,
  input: {
    token: string
    email: string
    name?: string | null
  }
): Promise<{
  customer_id: string
  auth_identity_id: string
  user_metadata: Record<string, unknown>
  redirect_to: string
}> {
  const pendingToken = await inspectCustomerAuthToken(scope, {
    token: input.token,
    tokenType: "line_pending_email",
  })

  if (!pendingToken.tokenRecord) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "LINE 補資料連結無效，請重新登入 LINE。"
    )
  }

  if (pendingToken.status === "expired" || pendingToken.status === "used") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "LINE 補資料連結已失效，請重新登入 LINE。"
    )
  }

  const payload = getPendingLinePayload(pendingToken.tokenRecord.metadata)

  if (!payload) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "LINE 補資料內容不完整，請重新登入 LINE。"
    )
  }

  const normalizedEmail = normalizeCustomerEmail(input.email)
  const membershipService = getMembershipService(scope)
  const oauthCustomerId = await membershipService.findCustomerByOAuth(
    "line",
    payload.profile.provider_user_id
  )

  if (oauthCustomerId) {
    const linkedResult = await linkLineOAuthForCustomer(scope, {
      customerId: oauthCustomerId,
      profile: {
        ...payload.profile,
        email: normalizedEmail,
      },
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: payload.token_expires_at
        ? new Date(payload.token_expires_at)
        : null,
      emailVerifiedAt: new Date(),
    })

    await membershipService.markCustomerAuthTokenUsed(pendingToken.tokenRecord.id, {
      ...(pendingToken.tokenRecord.metadata as Record<string, unknown>),
      consumed_reason: "line_registration_completed",
    })

    return {
      customer_id: linkedResult.customer_id,
      auth_identity_id: linkedResult.auth_identity_id,
      user_metadata: linkedResult.user_metadata,
      redirect_to: payload.redirect_to,
    }
  }

  const existingCustomer = await findCustomerByEmail(scope, normalizedEmail)
  let customerId: string

  if (existingCustomer) {
    customerId = existingCustomer.id
  } else {
    const authService = getAuthService(scope)
    const randomPassword = randomUUID()
    const { success, error, authIdentity } = await authService.register(
      "emailpass",
      {
        url: "",
        headers: {},
        query: {},
        body: {
          email: normalizedEmail,
          password: randomPassword,
        },
        protocol: "https",
      }
    )

    if (!success || !authIdentity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error || "建立 LINE 會員帳號失敗。"
      )
    }

    const createdCustomer = await createCustomerAccountWithIdentity(scope, {
      authIdentityId: authIdentity.id,
      email: normalizedEmail,
      name: input.name?.trim() || payload.profile.display_name,
      emailVerifiedAt: new Date(),
    })

    customerId = createdCustomer.id
  }

  const linkedResult = await linkLineOAuthForCustomer(scope, {
    customerId,
    profile: {
      ...payload.profile,
      email: normalizedEmail,
      display_name: input.name?.trim() || payload.profile.display_name,
    },
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.token_expires_at
      ? new Date(payload.token_expires_at)
      : null,
    emailVerifiedAt: new Date(),
  })

  await membershipService.markCustomerAuthTokenUsed(pendingToken.tokenRecord.id, {
    ...(pendingToken.tokenRecord.metadata as Record<string, unknown>),
    consumed_reason: "line_registration_completed",
  })

  return {
    customer_id: linkedResult.customer_id,
    auth_identity_id: linkedResult.auth_identity_id,
    user_metadata: linkedResult.user_metadata,
    redirect_to: payload.redirect_to,
  }
}
