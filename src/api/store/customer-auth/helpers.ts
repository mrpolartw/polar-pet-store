import type { MedusaContainer } from "@medusajs/framework/types"

import { getMembershipService } from "../../../lib/customer-auth/helpers"

export function getEmailVerificationMessage(
  status:
    | "verified"
    | "already_verified"
    | "invalid_token"
    | "token_expired"
    | "token_used"
): string {
  switch (status) {
    case "verified":
      return "Email 驗證成功，現在可以登入會員帳號。"
    case "already_verified":
      return "此 Email 已完成驗證，請直接登入。"
    case "token_expired":
      return "驗證連結已過期，請重新申請驗證信。"
    case "token_used":
      return "此驗證連結已使用，請重新申請驗證信。"
    default:
      return "驗證連結無效，請重新申請驗證信。"
  }
}

export function getPasswordResetMessage(
  status: "reset" | "valid" | "invalid_token" | "token_expired" | "token_used"
): string {
  switch (status) {
    case "reset":
      return "密碼已重設完成，請使用新密碼登入。"
    case "valid":
      return "重設密碼連結有效，請繼續設定新密碼。"
    case "token_expired":
      return "重設密碼連結已過期，請重新申請。"
    case "token_used":
      return "此重設密碼連結已使用，請重新申請。"
    default:
      return "重設密碼連結無效，請重新申請。"
  }
}

export async function retrieveCustomerAuthStatus(
  scope: MedusaContainer,
  customerId: string
): Promise<{
  customer_id: string
  email_verified: boolean
  email_verified_at: string | null
  line_linked: boolean
  line_display_name: string | null
  line_bound_at: string | null
}> {
  const membershipService = getMembershipService(scope)
  const profile = await membershipService.getCustomerProfile(customerId)
  const [lineLink] = await membershipService.listOAuthLinks(
    {
      customer_id: customerId,
      provider: "line",
    },
    {
      take: 1,
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )
  const rawProfile =
    (lineLink?.raw_profile as Record<string, unknown> | null) ?? null

  return {
    customer_id: customerId,
    email_verified: Boolean(profile?.email_verified_at),
    email_verified_at: profile?.email_verified_at
      ? new Date(profile.email_verified_at).toISOString()
      : null,
    line_linked: Boolean(lineLink),
    line_display_name:
      typeof rawProfile?.display_name === "string"
        ? rawProfile.display_name
        : null,
    line_bound_at: lineLink?.created_at
      ? new Date(lineLink.created_at).toISOString()
      : null,
  }
}
