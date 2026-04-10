import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MEMBERSHIP_MODULE } from "../../../modules/membership"
import {
  applyMembershipPointRedemption,
  expireMembershipPoints,
  processOrderRefundMembershipEffects,
} from "../membership-point-effects"
import { buildMembershipPointsSnapshot } from "../membership-point-balance"
import { recalculateCustomerMembershipLevel } from "../customer-membership-level"

const updateOrderRunMock = jest.fn(async () => ({ result: {} }))

jest.mock("@medusajs/core-flows", () => ({
  updateOrderWorkflow: jest.fn(() => ({
    run: updateOrderRunMock,
  })),
}))

jest.mock("../customer-membership-level", () => ({
  recalculateCustomerMembershipLevel: jest.fn(),
}))

const recalculateCustomerMembershipLevelMock = jest.mocked(
  recalculateCustomerMembershipLevel
)

describe("membership point effects", () => {
  type PointLogInput = {
    id: string
    customer_id: string
    points: number
    source: string
    reference_id?: string | null
    note?: string | null
    expired_at?: string | Date | null
    created_at: string | Date
    metadata?: Record<string, unknown> | null
  }

  let pointLogs: PointLogInput[]
  let orderMetadataById: Record<string, Record<string, unknown> | null>
  let createdLogCount: number

  function buildScope(): MedusaContainer {
    const membershipService = {
      getCustomerPoints: jest.fn(async (customerId: string, referenceAt?: Date | string) => {
        const logs = pointLogs
          .filter((log) => log.customer_id === customerId)
          .sort(
            (current, next) =>
              new Date(current.created_at).getTime() -
              new Date(next.created_at).getTime()
          )
          .map((log) => ({
            ...log,
            balance_after: pointLogs
              .filter(
                (candidate) =>
                  candidate.customer_id === customerId &&
                  new Date(candidate.created_at).getTime() <=
                    new Date(log.created_at).getTime()
              )
              .reduce((sum, candidate) => sum + candidate.points, 0),
          }))
        const snapshot = buildMembershipPointsSnapshot(logs, referenceAt)

        return {
          balance: snapshot.total_points,
          available_balance: snapshot.available_points,
          summary: snapshot,
          logs: [...logs].sort(
            (current, next) =>
              new Date(next.created_at).getTime() -
              new Date(current.created_at).getTime()
          ),
        }
      }),
      createPointLogOnce: jest.fn(async (input: {
        customer_id: string
        points: number
        source: string
        reference_id?: string | null
        note?: string | null
        expired_at?: Date | null
        metadata?: Record<string, unknown> | null
      }) => {
        const existing = pointLogs.find(
          (log) =>
            log.customer_id === input.customer_id &&
            log.source === input.source &&
            (log.reference_id ?? null) === (input.reference_id ?? null)
        )

        if (existing) {
          const balanceAfter = pointLogs
            .filter((log) => log.customer_id === input.customer_id)
            .reduce((sum, log) => sum + log.points, 0)

          return {
            point_log: {
              ...existing,
              balance_after: balanceAfter,
            },
            created: false,
          }
        }

        createdLogCount += 1
        const createdAt = new Date("2026-04-09T12:00:00.000Z")
        const nextLog = {
          id: `pl_created_${createdLogCount}`,
          customer_id: input.customer_id,
          points: input.points,
          source: input.source,
          reference_id: input.reference_id ?? null,
          note: input.note ?? null,
          expired_at: input.expired_at ?? null,
          created_at: createdAt,
          metadata: input.metadata ?? null,
        }

        pointLogs.push(nextLog)

        return {
          point_log: {
            ...nextLog,
            balance_after: pointLogs
              .filter((log) => log.customer_id === input.customer_id)
              .reduce((sum, log) => sum + log.points, 0),
          },
          created: true,
        }
      }),
      createAuditLog: jest.fn(async (payload) => payload),
      listPointLogs: jest.fn(async (selector: Record<string, unknown>) =>
        pointLogs
          .filter((log) => {
            if (selector.customer_id && log.customer_id !== selector.customer_id) {
              return false
            }

            if (selector.source && log.source !== selector.source) {
              return false
            }

            if (
              selector.reference_id &&
              (log.reference_id ?? null) !== selector.reference_id
            ) {
              return false
            }

            return true
          })
          .map((log) => ({
            ...log,
            balance_after: pointLogs
              .filter(
                (candidate) =>
                  candidate.customer_id === log.customer_id &&
                  new Date(candidate.created_at).getTime() <=
                    new Date(log.created_at).getTime()
              )
              .reduce((sum, candidate) => sum + candidate.points, 0),
          }))
      ),
      getPointLogByReference: jest.fn(
        async (customerId: string, source: string, referenceId: string) =>
          pointLogs.find(
            (log) =>
              log.customer_id === customerId &&
              log.source === source &&
              (log.reference_id ?? null) === referenceId
          ) ?? null
      ),
    }

    const query = {
      graph: jest.fn(async (input: { filters?: Record<string, unknown> }) => {
        if (input.filters?.id === "ord_123") {
          return {
            data: [
              {
                id: "ord_123",
                customer_id: "cus_123",
                total: 2000,
                currency_code: "TWD",
                created_at: "2026-04-09T08:00:00.000Z",
                status: "completed",
                metadata: orderMetadataById.ord_123,
              },
            ],
          }
        }

        if (input.filters?.id === "ord_no_reward") {
          return {
            data: [
              {
                id: "ord_no_reward",
                customer_id: "cus_123",
                total: 1000,
                currency_code: "TWD",
                created_at: "2026-04-09T08:00:00.000Z",
                status: "completed",
                metadata: orderMetadataById.ord_no_reward,
              },
            ],
          }
        }

        return { data: [] }
      }),
    }

    return {
      resolve: jest.fn((key: unknown) => {
        if (key === MEMBERSHIP_MODULE) {
          return membershipService
        }

        if (key === ContainerRegistrationKeys.QUERY) {
          return query
        }

        throw new Error(`Unexpected resolve key: ${String(key)}`)
      }),
    } as unknown as MedusaContainer
  }

  beforeEach(() => {
    jest.clearAllMocks()
    updateOrderRunMock.mockClear()
    createdLogCount = 0
    orderMetadataById = {
      ord_123: {
        membership_order_subtotal: 2000,
        membership_promo_discount: 0,
        membership_redemption_amount: 0,
        membership_refunded_amount: 0,
        membership_refund_references: [],
        membership_refunds: [],
      },
      ord_no_reward: {
        membership_order_subtotal: 1000,
        membership_promo_discount: 0,
        membership_redemption_amount: 0,
        membership_refunded_amount: 0,
        membership_refund_references: [],
        membership_refunds: [],
      },
    }
    pointLogs = [
      {
        id: "pl_order_reward",
        customer_id: "cus_123",
        points: 30,
        source: "order",
        reference_id: "ord_123",
        expired_at: "2027-04-09T12:00:00.000Z",
        created_at: "2026-04-09T09:00:00.000Z",
      },
      {
        id: "pl_birthday_reward",
        customer_id: "cus_123",
        points: 5,
        source: "birthday_bonus",
        reference_id: "ord_123",
        expired_at: "2027-04-09T12:00:00.000Z",
        created_at: "2026-04-09T09:01:00.000Z",
      },
      {
        id: "pl_bonus",
        customer_id: "cus_123",
        points: 40,
        source: "bonus",
        reference_id: "bonus_campaign",
        expired_at: "2026-04-08T00:00:00.000Z",
        created_at: "2025-04-08T00:00:00.000Z",
      },
      {
        id: "pl_upgrade_gift",
        customer_id: "cus_123",
        points: 20,
        source: "upgrade_gift",
        reference_id: "order:ord_upgrade:upgrade:family:silver",
        expired_at: "2027-05-01T00:00:00.000Z",
        created_at: "2026-05-01T00:00:00.000Z",
      },
    ]

    recalculateCustomerMembershipLevelMock.mockResolvedValue({
      customer_id: "cus_123",
      previous_level: null,
      current_level: null,
      resolved_level: null,
      changed: false,
      yearly_spent: 0,
      total_spent: 0,
      currency_code: "TWD",
      first_order_at: null,
      cycle_start: null,
      matched_threshold: null,
      used_fallback_level: false,
    } as never)
  })

  it("applies a point redemption when available points are sufficient and avoids duplicates", async () => {
    const scope = buildScope()

    const created = await applyMembershipPointRedemption(scope, {
      customerId: "cus_123",
      referenceId: "cart_123",
      points: 20,
      actorType: "customer",
      actorId: "cus_123",
      processedAt: "2026-04-09T12:00:00.000Z",
    })

    expect(created).toEqual(
      expect.objectContaining({
        redeemed_points: 20,
        redemption_amount: 20,
        created: true,
        available_points_before: 35,
        available_points_after: 15,
      })
    )

    const repeated = await applyMembershipPointRedemption(scope, {
      customerId: "cus_123",
      referenceId: "cart_123",
      points: 20,
      actorType: "customer",
      actorId: "cus_123",
      processedAt: "2026-04-09T12:00:00.000Z",
    })

    expect(repeated.created).toBe(false)
  })

  it("does not allow redeeming more than the available points", async () => {
    const scope = buildScope()

    await expect(
      applyMembershipPointRedemption(scope, {
        customerId: "cus_123",
        referenceId: "cart_999",
        points: 60,
        actorType: "customer",
        actorId: "cus_123",
        processedAt: "2026-04-09T12:00:00.000Z",
      })
    ).rejects.toThrow("Insufficient available points")
  })

  it("claws back points proportionally for a partial refund and prevents the same reference from running twice", async () => {
    const scope = buildScope()

    const created = await processOrderRefundMembershipEffects(scope, {
      orderId: "ord_123",
      referenceId: "refund:ord_123:1",
      originalRefundAmount: 500,
      actorType: "admin",
      actorId: "user_123",
      processedAt: "2026-04-10T12:00:00.000Z",
    })

    expect(created).toEqual(
      expect.objectContaining({
        order_id: "ord_123",
        refund_applied_amount: 500,
        total_refunded_amount: 500,
        clawed_back_points: 8,
        actual_refund_amount: 492,
        processed: true,
        recalculated: true,
      })
    )
    expect(updateOrderRunMock).toHaveBeenCalled()

    const repeated = await processOrderRefundMembershipEffects(scope, {
      orderId: "ord_123",
      referenceId: "refund:ord_123:1",
      originalRefundAmount: 500,
      actorType: "admin",
      actorId: "user_123",
      processedAt: "2026-04-10T12:00:00.000Z",
    })

    expect(repeated?.processed).toBe(false)
    expect(repeated?.clawed_back_points).toBe(8)
  })

  it("records a refund reference even when the order has no reward logs to claw back", async () => {
    const scope = buildScope()

    const created = await processOrderRefundMembershipEffects(scope, {
      orderId: "ord_no_reward",
      referenceId: "refund:ord_no_reward:1",
      originalRefundAmount: 300,
      actorType: "admin",
      actorId: "user_123",
      processedAt: "2026-04-10T12:00:00.000Z",
    })

    expect(created).toEqual(
      expect.objectContaining({
        order_id: "ord_no_reward",
        refund_applied_amount: 300,
        clawed_back_points: 0,
        actual_refund_amount: 300,
        processed: true,
        recalculated: true,
      })
    )
    expect(updateOrderRunMock).toHaveBeenCalled()
  })

  it("materializes pending expired points into expire logs without duplicating the same grant", async () => {
    const scope = buildScope()

    const created = await expireMembershipPoints(scope, {
      customerId: "cus_123",
      referenceAt: "2026-04-09T12:00:00.000Z",
    })

    expect(created).toEqual(
      expect.objectContaining({
        processed: true,
        expired_points: 40,
        processed_logs_count: 1,
        pending_expired_points_after: 0,
      })
    )

    const repeated = await expireMembershipPoints(scope, {
      customerId: "cus_123",
      referenceAt: "2026-04-09T12:00:00.000Z",
    })

    expect(repeated.processed).toBe(false)
    expect(repeated.expired_points).toBe(0)
  })
})
