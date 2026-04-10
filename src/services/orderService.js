import { mockOrderHandlers } from '../mocks/mockHandlers'
import apiClient from '../utils/apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

if (USE_MOCK && import.meta.env.PROD) {
  console.error('[orderService] MOCK MODE IS ACTIVE IN PRODUCTION!')
}

export const createOrder = async (payload) => {
  if (USE_MOCK) {
    return mockOrderHandlers.createOrder(payload)
  }

  return apiClient.post('/store/orders', payload)
}

export const getOrder = async (orderId) => {
  if (USE_MOCK) {
    return mockOrderHandlers.getOrder(orderId)
  }

  return apiClient.get(`/store/order-lookups/${orderId}`)
}

export const getOrders = async (params = {}) => {
  if (USE_MOCK) {
    return mockOrderHandlers.getOrders(params)
  }

  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  if (params.phone) {
    return apiClient.get(`/store/order-lookups${suffix}`)
  }

  return apiClient.get(`/store/customers/me/orders${suffix}`)
}

export const validatePromoCode = async (code) => {
  if (USE_MOCK) {
    return mockOrderHandlers.validatePromoCode(code)
  }

  return apiClient.post('/store/carts/promo-codes', { code })
}

export default {
  createOrder,
  getOrder,
  getOrders,
  validatePromoCode,
}
