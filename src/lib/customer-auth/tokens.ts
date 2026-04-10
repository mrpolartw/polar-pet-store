import { createHash, randomBytes } from "crypto"

import type { MedusaContainer } from "@medusajs/framework/types"

import type MembershipModuleService from "../../modules/membership/service"
import type { CustomerAuthTokenType } from "../../modules/membership/constants"
import { getMembershipService } from "./helpers"

type IssueCustomerAuthTokenInput = {
  customerId?: string | null
  authIdentityId?: string | null
  tokenType: CustomerAuthTokenType
  expiresAt: Date
  metadata?: Record<string, unknown> | null
  invalidateExisting?: boolean
}

type MembershipAuthTokenRecord = Awaited<
  ReturnType<MembershipModuleService["findCustomerAuthTokenByHash"]>
>

export type CustomerAuthTokenStatus =
  | "valid"
  | "invalid"
  | "expired"
  | "used"

export function hashCustomerAuthToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex")
}

export async function issueCustomerAuthToken(
  scope: MedusaContainer,
  input: IssueCustomerAuthTokenInput
): Promise<{
  token: string
  tokenHash: string
}> {
  const membershipService = getMembershipService(scope)
  const rawToken = randomBytes(32).toString("base64url")
  const tokenHash = hashCustomerAuthToken(rawToken)

  if (input.invalidateExisting && (input.customerId || input.authIdentityId)) {
    await membershipService.invalidateCustomerAuthTokens(
      {
        customer_id: input.customerId ?? undefined,
        auth_identity_id: input.authIdentityId ?? undefined,
        token_type: input.tokenType,
      },
      {
        invalidated_reason: "superseded",
      }
    )
  }

  await membershipService.createCustomerAuthToken({
    customer_id: input.customerId ?? null,
    auth_identity_id: input.authIdentityId ?? null,
    token_type: input.tokenType,
    token_hash: tokenHash,
    expires_at: input.expiresAt,
    metadata: input.metadata ?? null,
  })

  return {
    token: rawToken,
    tokenHash,
  }
}

export async function inspectCustomerAuthToken(
  scope: MedusaContainer,
  input: {
    token: string
    tokenType: CustomerAuthTokenType
  }
): Promise<{
  status: CustomerAuthTokenStatus
  tokenRecord: MembershipAuthTokenRecord
}> {
  const membershipService = getMembershipService(scope)
  const tokenRecord = await membershipService.findCustomerAuthTokenByHash(
    hashCustomerAuthToken(input.token),
    input.tokenType
  )

  if (!tokenRecord) {
    return {
      status: "invalid",
      tokenRecord: null,
    }
  }

  if (tokenRecord.used_at) {
    return {
      status: "used",
      tokenRecord,
    }
  }

  if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
    return {
      status: "expired",
      tokenRecord,
    }
  }

  return {
    status: "valid",
    tokenRecord,
  }
}
