import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEmptyMembershipSummary,
  normalizeMembershipHistoryItem,
  normalizeMembershipSummaryResponse,
} from '../utils.js'

test('normalizeMembershipSummaryResponse maps backend summary fields to front shape', () => {
  const summary = normalizeMembershipSummaryResponse({
    customer_id: 'cus_123',
    current_level: {
      id: 'level_gold',
      name: '金卡會員',
    },
    points_balance: 88,
    available_points: 88,
    yearly_spent: 4560,
    total_spent: 18900,
    points_summary: {
      total_points: 120,
      available_points: 88,
      expired_points: 12,
      redeemed_points: 20,
      refunded_points: 5,
    },
    recent_point_logs: [
      {
        id: 'pl_1',
        source: 'order',
        points: 30,
        note: '訂單回饋',
        reference_id: 'ord_123',
        expired_at: '2027-04-09T00:00:00.000Z',
        created_at: '2026-04-09T00:00:00.000Z',
      },
    ],
    recent_history: [
      {
        id: 'audit_1',
        action: 'customer.favorite.added',
        label: '已加入收藏商品',
        actor_type: 'customer',
        actor_id: 'cus_123',
        created_at: '2026-04-10T00:00:00.000Z',
        metadata: {
          product_id: 'prod_123',
        },
      },
    ],
  })

  assert.equal(summary.customerId, 'cus_123')
  assert.equal(summary.currentLevel.name, '金卡會員')
  assert.equal(summary.availablePoints, 88)
  assert.equal(summary.yearlySpent, 4560)
  assert.equal(summary.totalSpent, 18900)
  assert.deepEqual(summary.pointsSummary, {
    totalPoints: 120,
    availablePoints: 88,
    expiredPoints: 12,
    redeemedPoints: 20,
    refundedPoints: 5,
  })
  assert.equal(summary.recentPointLogs[0].source, 'order')
  assert.equal(summary.recentHistory[0].label, '已加入收藏商品')
  assert.deepEqual(summary.recentHistory[0].metadata, {
    product_id: 'prod_123',
  })
})

test('buildEmptyMembershipSummary provides a stable empty state', () => {
  assert.deepEqual(buildEmptyMembershipSummary('cus_empty'), {
    customerId: 'cus_empty',
    currentLevel: null,
    pointsBalance: 0,
    availablePoints: 0,
    yearlySpent: 0,
    totalSpent: 0,
    pointsSummary: {
      totalPoints: 0,
      availablePoints: 0,
      expiredPoints: 0,
      redeemedPoints: 0,
      refundedPoints: 0,
    },
    recentPointLogs: [],
    recentHistory: [],
  })
})

test('normalizeMembershipHistoryItem keeps the history contract stable', () => {
  assert.deepEqual(
    normalizeMembershipHistoryItem({
      id: 'audit_2',
      action: 'customer.subscription.paused',
      label: '訂閱已暫停',
      actor_type: 'customer',
      actor_id: 'cus_456',
      created_at: '2026-04-11T12:00:00.000Z',
      metadata: {
        subscription_id: 'sub_123',
      },
    }),
    {
      id: 'audit_2',
      action: 'customer.subscription.paused',
      label: '訂閱已暫停',
      actorType: 'customer',
      actorId: 'cus_456',
      createdAt: '2026-04-11T12:00:00.000Z',
      metadata: {
        subscription_id: 'sub_123',
      },
    }
  )
})
