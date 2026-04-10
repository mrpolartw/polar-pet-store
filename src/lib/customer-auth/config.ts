import { MedusaError } from "@medusajs/framework/utils"

const ONE_MINUTE_IN_MS = 60 * 1000

export const CUSTOMER_EMAIL_VERIFICATION_TTL_MS = 60 * ONE_MINUTE_IN_MS
export const CUSTOMER_PASSWORD_RESET_TTL_MS = 15 * ONE_MINUTE_IN_MS
export const CUSTOMER_LINE_STATE_TTL_MS = 15 * ONE_MINUTE_IN_MS
export const CUSTOMER_LINE_PENDING_EMAIL_TTL_MS = 15 * ONE_MINUTE_IN_MS

const DEFAULT_BACKEND_BASE_URL = "http://localhost:9000"
const DEFAULT_STOREFRONT_BASE_URL = "http://localhost:5173/polar-pet-store"

export type LineOAuthConfig = {
  channelId: string
  channelSecret: string
  callbackUrl: string
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

export function getBackendBaseUrl(): string {
  return trimTrailingSlash(
    process.env.MEDUSA_BACKEND_URL ?? DEFAULT_BACKEND_BASE_URL
  )
}

export function getStorefrontBaseUrl(): string {
  return trimTrailingSlash(
    process.env.STOREFRONT_URL ?? DEFAULT_STOREFRONT_BASE_URL
  )
}

export function buildStorefrontUrl(
  path: string,
  searchParams?: Record<string, string | number | boolean | null | undefined>
): string {
  const baseUrl = new URL(`${getStorefrontBaseUrl()}/`)
  const normalizedPath = path.replace(/^\/+/, "")
  const pathname = baseUrl.pathname.replace(/\/+$/, "")

  baseUrl.pathname = `${pathname}/${normalizedPath}`.replace(/\/+/g, "/")

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return
      }

      baseUrl.searchParams.set(key, String(value))
    })
  }

  return baseUrl.toString()
}

export function sanitizeStorefrontRedirect(
  redirectTo: string | undefined,
  fallbackPath: string
): string {
  if (!redirectTo) {
    return buildStorefrontUrl(fallbackPath)
  }

  try {
    const storefrontUrl = new URL(`${getStorefrontBaseUrl()}/`)
    const targetUrl = new URL(redirectTo, storefrontUrl)
    const storefrontBasePath = storefrontUrl.pathname.replace(/\/+$/, "")

    if (targetUrl.origin !== storefrontUrl.origin) {
      return buildStorefrontUrl(fallbackPath)
    }

    if (!targetUrl.pathname.startsWith(storefrontBasePath)) {
      return buildStorefrontUrl(fallbackPath)
    }

    return targetUrl.toString()
  } catch {
    return buildStorefrontUrl(fallbackPath)
  }
}

export function getCustomerEmailVerificationUrl(token: string): string {
  return buildStorefrontUrl("verify-email", { token })
}

export function getCustomerPasswordResetUrl(token: string): string {
  return buildStorefrontUrl("reset-password", { token })
}

export function getLineOAuthConfig(): LineOAuthConfig {
  const channelId = process.env.LINE_CHANNEL_ID?.trim()
  const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim()
  const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL?.trim()

  if (!channelId || !channelSecret) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "LINE OAuth 設定不完整，請先設定 LINE_CHANNEL_ID 與 LINE_CHANNEL_SECRET"
    )
  }

  return {
    channelId,
    channelSecret,
    callbackUrl:
      callbackUrl ||
      `${getBackendBaseUrl()}/store/auth/customer/line/callback`,
  }
}
