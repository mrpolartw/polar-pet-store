import apiClient from '../utils/apiClient'
import authService from './authService'
import {
  normalizeMembershipSummaryResponse,
  normalizeMembershipHistoryItem,
  normalizeMembershipPointLog,
} from '../modules/membership/utils'
import { validateRedeemablePoints } from '../modules/checkout/pointRedemption'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const mockMembershipState = new Map()

const buildMockLevel = (customer) => {
  if (!customer) return null

  if ((customer.points ?? 0) >= 10000) {
    return {
      id: 'mock_black',
      name: '黑卡會員',
      sort_order: 40,
      reward_rate: 5,
      birthday_reward_rate: 8,
      upgrade_gift_points: 800,
      upgrade_threshold: 80000,
      auto_upgrade: true,
      can_join_event: true,
    }
  }

  if ((customer.points ?? 0) >= 3000) {
    return {
      id: 'mock_gold',
      name: '金卡會員',
      sort_order: 30,
      reward_rate: 3,
      birthday_reward_rate: 5,
      upgrade_gift_points: 300,
      upgrade_threshold: 30000,
      auto_upgrade: true,
      can_join_event: true,
    }
  }

  if ((customer.points ?? 0) >= 1000) {
    return {
      id: 'mock_silver',
      name: '銀卡會員',
      sort_order: 20,
      reward_rate: 2,
      birthday_reward_rate: 4,
      upgrade_gift_points: 100,
      upgrade_threshold: 10000,
      auto_upgrade: true,
      can_join_event: true,
    }
  }

  return {
    id: 'mock_family',
    name: '家庭會員',
    sort_order: 10,
    reward_rate: 1,
    birthday_reward_rate: 2,
    upgrade_gift_points: 0,
    upgrade_threshold: 0,
    auto_upgrade: true,
    can_join_event: false,
  }
}

function buildMockLogs(customer) {
  const now = new Date()
  const nextYear = new Date(now)
  nextYear.setFullYear(nextYear.getFullYear() + 1)

  return [
    {
      id: `pl-order-${customer.id}`,
      source: 'order',
      points: 120,
      note: '訂單回饋',
      reference_id: 'ord_mock_001',
      expired_at: nextYear.toISOString(),
      created_at: now.toISOString(),
      metadata: null,
    },
    {
      id: `pl-redeem-${customer.id}`,
      source: 'redeem',
      points: -40,
      note: '點數折抵',
      reference_id: 'ord_mock_000',
      expired_at: null,
      created_at: new Date(now.getTime() - 86400000 * 4).toISOString(),
      metadata: null,
    },
    {
      id: `pl-expire-${customer.id}`,
      source: 'expire',
      points: -15,
      note: '點數到期',
      reference_id: 'expire_mock_001',
      expired_at: null,
      created_at: new Date(now.getTime() - 86400000 * 30).toISOString(),
      metadata: null,
    },
  ]
}

function buildInitialMockMembership(customer) {
  const availablePoints = Number(customer?.points ?? 0)

  return normalizeMembershipSummaryResponse({
    customer_id: customer?.id ?? '',
    current_level: buildMockLevel(customer),
    points_balance: availablePoints,
    available_points: availablePoints,
    yearly_spent: availablePoints >= 10000 ? 42000 : 6800,
    total_spent: availablePoints >= 10000 ? 128000 : 23800,
    points_summary: {
      total_points: availablePoints,
      available_points: availablePoints,
      expired_points: 15,
      redeemed_points: 40,
      refunded_points: 0,
    },
    recent_point_logs: buildMockLogs(customer),
  })
}

async function getMockCustomer() {
  const data = await authService.getMe()
  return data?.customer ?? data ?? null
}

async function getMockMembershipState() {
  const customer = await getMockCustomer()

  if (!customer) {
    throw new Error('請先登入會員帳號')
  }

  if (!mockMembershipState.has(customer.id)) {
    mockMembershipState.set(customer.id, buildInitialMockMembership(customer))
  }

  return mockMembershipState.get(customer.id)
}

function createMockPointLog({ customerId, points, source, referenceId, note, expiredAt }) {
  return normalizeMembershipPointLog({
    id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    customer_id: customerId,
    source,
    points,
    note,
    reference_id: referenceId,
    expired_at: expiredAt ?? null,
    created_at: new Date().toISOString(),
    metadata: null,
  })
}

export async function getCustomerMembershipSummary() {
  if (USE_MOCK) {
    return getMockMembershipState()
  }

  const data = await apiClient.get('/store/customers/me/membership')
  return normalizeMembershipSummaryResponse(data)
}

export async function getCustomerPointHistory({ limit = 20, offset = 0 } = {}) {
  if (USE_MOCK) {
    const summary = await getMockMembershipState()

    return {
      balance: summary.pointsSummary.totalPoints,
      available_balance: summary.availablePoints,
      points_summary: {
        total_points: summary.pointsSummary.totalPoints,
        available_points: summary.pointsSummary.availablePoints,
        expired_points: summary.pointsSummary.expiredPoints,
        redeemed_points: summary.pointsSummary.redeemedPoints,
        refunded_points: summary.pointsSummary.refundedPoints,
      },
      logs: summary.recentPointLogs.slice(offset, offset + limit),
      count: summary.recentPointLogs.length,
      limit,
      offset,
    }
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  return apiClient.get(`/store/customers/me/points?${params.toString()}`)
}

function normalizeProductDetailPayload(payload) {
  const product = payload?.product ?? payload ?? null

  if (!product) {
    return null
  }

  return {
    id: product.id ?? '',
    title: product.title ?? product.name ?? '',
    handle: product.handle ?? product.slug ?? product.id ?? '',
    thumbnail: product.thumbnail ?? product.images?.[0]?.url ?? '',
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          id: variant.id ?? '',
          title: variant.title ?? variant.name ?? '',
          price:
            Number(
              variant.calculated_price?.calculated_amount ??
                variant.prices?.[0]?.amount ??
                variant.price ??
                0
            ) || 0,
          currencyCode:
            variant.calculated_price?.currency_code ??
            variant.prices?.[0]?.currency_code ??
            'TWD',
        }))
      : [],
    isAvailable:
      product.status ? product.status === 'published' : true,
  }
}

async function fetchFavoriteProductDetail(productId) {
  try {
    const payload = await apiClient.get(`/store/products/${productId}`)
    return normalizeProductDetailPayload(payload)
  } catch {
    return null
  }
}

export async function getCustomerFavorites() {
  const data = await apiClient.get('/store/customers/me/favorites')
  const items = Array.isArray(data?.items) ? data.items : []
  const productMap = new Map()

  await Promise.all(
    items.map(async (item) => {
      if (!item?.product_id || productMap.has(item.product_id)) {
        return
      }

      productMap.set(item.product_id, await fetchFavoriteProductDetail(item.product_id))
    })
  )

  return {
    items: items.map((item) => {
      const product = productMap.get(item.product_id)
      const variant = product?.variants?.find((entry) => entry.id === item.variant_id) ?? null

      return {
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id ?? '',
        createdAt: item.created_at ?? null,
        productName: product?.title ?? item.product_id,
        productHandle: product?.handle ?? item.product_id,
        productImage: product?.thumbnail ?? '',
        variantName: variant?.title ?? '',
        price: variant?.price ?? 0,
        currencyCode: variant?.currencyCode ?? 'TWD',
        isAvailable: Boolean(product?.isAvailable),
      }
    }),
    count: Number(data?.count ?? items.length),
  }
}

export async function addCustomerFavorite({ productId, variantId }) {
  return apiClient.post('/store/customers/me/favorites', {
    product_id: productId,
    variant_id: variantId || null,
  })
}

export async function removeCustomerFavorite(productId) {
  return apiClient.del(`/store/customers/me/favorites/${productId}`)
}

export async function getCustomerPets() {
  const data = await apiClient.get('/store/customers/me/pets')
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    count: Number(data?.count ?? 0),
  }
}

export async function createCustomerPet(payload) {
  return apiClient.post('/store/customers/me/pets', payload)
}

export async function updateCustomerPet(id, payload) {
  return apiClient.patch(`/store/customers/me/pets/${id}`, payload)
}

export async function deleteCustomerPet(id) {
  return apiClient.del(`/store/customers/me/pets/${id}`)
}

export async function getCustomerSubscriptions() {
  const data = await apiClient.get('/store/subscriptions')

  return {
    items: Array.isArray(data?.subscriptions)
      ? data.subscriptions
      : data?.subscription
        ? [data.subscription]
        : [],
    activeSubscription: data?.active_subscription ?? data?.subscription ?? null,
    latestSubscription: data?.latest_subscription ?? data?.subscription ?? null,
    count: Number(data?.count ?? 0),
  }
}

export async function updateCustomerSubscription(id, payload) {
  return apiClient.patch(`/store/subscriptions/${id}`, payload)
}

export async function cancelCustomerSubscription(id) {
  return apiClient.del(`/store/subscriptions/${id}`)
}

export async function getCustomerMembershipHistory() {
  const data = await apiClient.get('/store/customers/me/membership/history')

  return {
    items: Array.isArray(data?.items)
      ? data.items.map(normalizeMembershipHistoryItem).filter(Boolean)
      : [],
    count: Number(data?.count ?? 0),
  }
}

export async function previewPointRedemption({ points, orderSubtotal }) {
  if (USE_MOCK) {
    const summary = await getMockMembershipState()
    const preview = validateRedeemablePoints({
      requestedPoints: points,
      availablePoints: summary.availablePoints,
      orderSubtotal,
    })

    return {
      preview: {
        customer_id: summary.customerId,
        requested_points: preview.requestedPoints,
        available_points: preview.availablePoints,
        max_redeemable_points: preview.maxRedeemablePoints,
        redeemable_points: preview.redeemablePoints,
        redemption_amount: preview.redemptionAmount,
        order_subtotal: preview.orderSubtotal,
        remaining_amount: preview.remainingAmount,
        is_valid: preview.isValid,
        validation_message: preview.validationMessage,
      },
    }
  }

  return apiClient.post('/store/customers/me/points/redeem-preview', {
    points,
    order_subtotal: orderSubtotal,
  })
}

export async function applyPointRedemption({
  points,
  orderSubtotal,
  referenceId,
  note,
}) {
  if (USE_MOCK) {
    const summary = await getMockMembershipState()
    const existingLog = summary.recentPointLogs.find(
      (log) => log.source === 'redeem' && log.referenceId === referenceId
    )
    const preview = validateRedeemablePoints({
      requestedPoints: points,
      availablePoints: summary.availablePoints,
      orderSubtotal,
    })

    if (!preview.isValid || preview.redeemablePoints <= 0) {
      throw new Error(preview.validationMessage ?? '點數折抵資料不正確')
    }

    if (existingLog) {
      return {
        redemption: {
          customer_id: summary.customerId,
          reference_id: referenceId,
          requested_points: preview.requestedPoints,
          available_points: preview.availablePoints,
          max_redeemable_points: preview.maxRedeemablePoints,
          redeemable_points: preview.redeemablePoints,
          redemption_amount: preview.redemptionAmount,
          order_subtotal: preview.orderSubtotal,
          remaining_amount: preview.remainingAmount,
          is_valid: true,
          validation_message: null,
          created: false,
          point_log_id: existingLog.id,
          available_points_before: summary.availablePoints,
          available_points_after: summary.availablePoints,
        },
      }
    }

    const nextTotalPoints = Math.max(
      0,
      summary.pointsSummary.totalPoints - preview.redeemablePoints
    )
    const nextAvailablePoints = Math.max(
      0,
      summary.availablePoints - preview.redeemablePoints
    )
    const pointLog = createMockPointLog({
      customerId: summary.customerId,
      points: -preview.redeemablePoints,
      source: 'redeem',
      referenceId,
      note: note ?? '前台結帳點數折抵',
    })

    const nextSummary = {
      ...summary,
      pointsBalance: nextAvailablePoints,
      availablePoints: nextAvailablePoints,
      pointsSummary: {
        ...summary.pointsSummary,
        totalPoints: nextTotalPoints,
        availablePoints: nextAvailablePoints,
        redeemedPoints:
          summary.pointsSummary.redeemedPoints + preview.redeemablePoints,
      },
      recentPointLogs: [pointLog, ...summary.recentPointLogs].slice(0, 20),
    }

    mockMembershipState.set(summary.customerId, nextSummary)

    return {
      redemption: {
        customer_id: summary.customerId,
        reference_id: referenceId,
        requested_points: preview.requestedPoints,
        available_points: preview.availablePoints,
        max_redeemable_points: preview.maxRedeemablePoints,
        redeemable_points: preview.redeemablePoints,
        redemption_amount: preview.redemptionAmount,
        order_subtotal: preview.orderSubtotal,
        remaining_amount: preview.remainingAmount,
        is_valid: true,
        validation_message: null,
        created: true,
        point_log_id: pointLog.id,
        available_points_before: summary.availablePoints,
        available_points_after: nextAvailablePoints,
      },
    }
  }

  return apiClient.post('/store/customers/me/points/redeem', {
    points,
    order_subtotal: orderSubtotal,
    reference_id: referenceId,
    note,
  })
}

const membershipService = {
  getCustomerMembershipSummary,
  getCustomerPointHistory,
  getCustomerFavorites,
  addCustomerFavorite,
  removeCustomerFavorite,
  getCustomerPets,
  createCustomerPet,
  updateCustomerPet,
  deleteCustomerPet,
  getCustomerSubscriptions,
  updateCustomerSubscription,
  cancelCustomerSubscription,
  getCustomerMembershipHistory,
  previewPointRedemption,
  applyPointRedemption,
}

export default membershipService
