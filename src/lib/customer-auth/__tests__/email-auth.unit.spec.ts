import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import {
  confirmCustomerEmailVerification,
  confirmCustomerPasswordReset,
  inspectCustomerPasswordResetToken,
  loginCustomerWithEmailPassword,
} from "../email-auth"
import { hashCustomerAuthToken } from "../tokens"

type TokenType = "email_verification" | "password_reset"

type MockTokenRecord = {
  id: string
  customer_id: string | null
  auth_identity_id: string | null
  token_type: TokenType
  token_hash: string
  expires_at: Date
  used_at: Date | null
  metadata: Record<string, unknown> | null
}

function buildTokenRecord(input: {
  rawToken: string
  tokenType: TokenType
  customerId?: string | null
  expiresAt?: Date
  usedAt?: Date | null
  metadata?: Record<string, unknown> | null
}): MockTokenRecord {
  return {
    id: `${input.tokenType}_${input.rawToken}`,
    customer_id: input.customerId ?? "cus_123",
    auth_identity_id: "auth_123",
    token_type: input.tokenType,
    token_hash: hashCustomerAuthToken(input.rawToken),
    expires_at:
      input.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    used_at: input.usedAt ?? null,
    metadata: input.metadata ?? { email: "member@example.com" },
  }
}

function buildScope(options?: {
  tokens?: MockTokenRecord[]
  profile?: Record<string, unknown> | null
  authenticateResult?: {
    success: boolean
    authIdentity?: Record<string, unknown> | null
  }
  updateProviderResult?: {
    success: boolean
    error?: string | null
  }
  customerEmail?: string
}) {
  let profileState =
    options?.profile ??
    ({
      id: "profile_123",
      customer_id: "cus_123",
      email_verified_at: null,
    } as Record<string, unknown>)

  const tokens = [...(options?.tokens ?? [])]

  const membershipService = {
    findCustomerAuthTokenByHash: jest.fn(
      async (tokenHash: string, tokenType: TokenType) =>
        tokens.find(
          (token) =>
            token.token_hash === tokenHash && token.token_type === tokenType
        ) ?? null
    ),
    getCustomerProfile: jest.fn(async () => profileState),
    upsertCustomerProfile: jest.fn(async (_customerId: string, data: Record<string, unknown>) => {
      profileState = {
        ...(profileState ?? {}),
        ...data,
      }

      return profileState
    }),
    markCustomerAuthTokenUsed: jest.fn(async (id: string, metadata?: Record<string, unknown> | null) => {
      const record = tokens.find((token) => token.id === id)

      if (!record) {
        throw new Error(`Unknown token id: ${id}`)
      }

      record.used_at = new Date()
      record.metadata = metadata ?? record.metadata
      return record
    }),
    invalidateCustomerAuthTokens: jest.fn(
      async (
        filters: Partial<Pick<MockTokenRecord, "customer_id" | "auth_identity_id" | "token_type">>,
        metadata?: Record<string, unknown> | null
      ) => {
        const matched = tokens.filter((token) => {
          if (filters.customer_id && token.customer_id !== filters.customer_id) {
            return false
          }

          if (
            filters.auth_identity_id &&
            token.auth_identity_id !== filters.auth_identity_id
          ) {
            return false
          }

          if (filters.token_type && token.token_type !== filters.token_type) {
            return false
          }

          return true
        })

        matched.forEach((token) => {
          token.used_at = token.used_at ?? new Date()
          token.metadata = metadata
            ? { ...(token.metadata ?? {}), ...metadata }
            : token.metadata
        })

        return matched
      }
    ),
    createAuditLog: jest.fn(async (payload) => payload),
  }

  const authService = {
    authenticate: jest.fn(async () => ({
      success: options?.authenticateResult?.success ?? true,
      authIdentity:
        options?.authenticateResult?.authIdentity ??
        {
          id: "auth_123",
          app_metadata: {
            customer_id: "cus_123",
          },
        },
    })),
    updateProvider: jest.fn(async () => ({
      success: options?.updateProviderResult?.success ?? true,
      error: options?.updateProviderResult?.error ?? null,
    })),
  }

  const customerService = {
    retrieveCustomer: jest.fn(async () => ({
      id: "cus_123",
      email: options?.customerEmail ?? "member@example.com",
    })),
  }

  const scope = {
    resolve: jest.fn((key: string) => {
      if (key === MEMBERSHIP_MODULE) {
        return membershipService
      }

      if (key === Modules.AUTH) {
        return authService
      }

      if (key === Modules.CUSTOMER) {
        return customerService
      }

      throw new Error(`Unexpected resolve key: ${String(key)}`)
    }),
  } as unknown as MedusaContainer

  return {
    scope,
    membershipService,
    authService,
    customerService,
    tokens,
  }
}

describe("customer auth email and password flows", () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe("email verification tokens", () => {
    it("verifies a valid email verification token", async () => {
      const { scope, membershipService } = buildScope({
        tokens: [
          buildTokenRecord({
            rawToken: "valid-email-token",
            tokenType: "email_verification",
          }),
        ],
      })

      const result = await confirmCustomerEmailVerification(
        scope,
        "valid-email-token"
      )

      expect(result).toEqual({
        status: "verified",
        customer_id: "cus_123",
      })
      expect(membershipService.upsertCustomerProfile).toHaveBeenCalledWith(
        "cus_123",
        expect.objectContaining({
          email_verified_at: expect.any(Date),
        })
      )
      expect(membershipService.createAuditLog).toHaveBeenCalled()
    })

    it("rejects an expired email verification token", async () => {
      const { scope } = buildScope({
        tokens: [
          buildTokenRecord({
            rawToken: "expired-email-token",
            tokenType: "email_verification",
            expiresAt: new Date(Date.now() - 60 * 1000),
          }),
        ],
      })

      await expect(
        confirmCustomerEmailVerification(scope, "expired-email-token")
      ).resolves.toEqual({
        status: "token_expired",
        customer_id: "cus_123",
      })
    })

    it("rejects a used email verification token", async () => {
      const { scope } = buildScope({
        tokens: [
          buildTokenRecord({
            rawToken: "used-email-token",
            tokenType: "email_verification",
            usedAt: new Date(),
          }),
        ],
      })

      await expect(
        confirmCustomerEmailVerification(scope, "used-email-token")
      ).resolves.toEqual({
        status: "token_used",
        customer_id: "cus_123",
      })
    })

    it("rejects an invalid email verification token", async () => {
      const { scope } = buildScope()

      await expect(
        confirmCustomerEmailVerification(scope, "missing-email-token")
      ).resolves.toEqual({
        status: "invalid_token",
        customer_id: null,
      })
    })
  })

  describe("password reset tokens", () => {
    it("detects valid, expired, used, and invalid password reset tokens", async () => {
      const { scope } = buildScope({
        tokens: [
          buildTokenRecord({
            rawToken: "valid-reset-token",
            tokenType: "password_reset",
          }),
          buildTokenRecord({
            rawToken: "expired-reset-token",
            tokenType: "password_reset",
            expiresAt: new Date(Date.now() - 60 * 1000),
          }),
          buildTokenRecord({
            rawToken: "used-reset-token",
            tokenType: "password_reset",
            usedAt: new Date(),
          }),
        ],
      })

      await expect(
        inspectCustomerPasswordResetToken(scope, "valid-reset-token")
      ).resolves.toEqual({
        status: "valid",
        customer_id: "cus_123",
      })

      await expect(
        inspectCustomerPasswordResetToken(scope, "expired-reset-token")
      ).resolves.toEqual({
        status: "token_expired",
        customer_id: "cus_123",
      })

      await expect(
        inspectCustomerPasswordResetToken(scope, "used-reset-token")
      ).resolves.toEqual({
        status: "token_used",
        customer_id: "cus_123",
      })

      await expect(
        inspectCustomerPasswordResetToken(scope, "invalid-reset-token")
      ).resolves.toEqual({
        status: "invalid_token",
        customer_id: null,
      })
    })

    it("marks the password reset token as used after confirmation", async () => {
      const { scope, authService, membershipService } = buildScope({
        tokens: [
          buildTokenRecord({
            rawToken: "confirm-reset-token",
            tokenType: "password_reset",
          }),
        ],
      })

      await expect(
        inspectCustomerPasswordResetToken(scope, "confirm-reset-token")
      ).resolves.toEqual({
        status: "valid",
        customer_id: "cus_123",
      })

      await expect(
        confirmCustomerPasswordReset(scope, {
          token: "confirm-reset-token",
          password: "NewPassword1",
        })
      ).resolves.toEqual({
        status: "reset",
        customer_id: "cus_123",
      })

      expect(authService.updateProvider).toHaveBeenCalledWith(
        "emailpass",
        expect.objectContaining({
          entity_id: "member@example.com",
          email: "member@example.com",
          password: "NewPassword1",
        })
      )
      expect(membershipService.invalidateCustomerAuthTokens).toHaveBeenCalled()

      await expect(
        inspectCustomerPasswordResetToken(scope, "confirm-reset-token")
      ).resolves.toEqual({
        status: "token_used",
        customer_id: "cus_123",
      })
    })
  })

  describe("email login guard", () => {
    it("rejects login for customers whose email is not verified", async () => {
      const { scope } = buildScope({
        profile: {
          id: "profile_123",
          customer_id: "cus_123",
          email_verified_at: null,
        },
        authenticateResult: {
          success: true,
          authIdentity: {
            id: "auth_123",
            app_metadata: {
              customer_id: "cus_123",
            },
          },
        },
      })

      const result = await loginCustomerWithEmailPassword(
        scope,
        {
          url: "/store/auth/customer/login",
          headers: {},
          query: {},
          protocol: "https",
          session: {},
        } as never,
        {
          email: "member@example.com",
          password: "Password1",
        }
      )

      expect(result).toEqual({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "請先完成 Email 驗證後再登入。",
        email: "member@example.com",
      })
    })
  })
})
