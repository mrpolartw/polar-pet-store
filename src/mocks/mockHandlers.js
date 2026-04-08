/**
 * @fileoverview Mock API handlers
 * @description 在 VITE_USE_MOCK=true 時模擬後端 API 行為
 */

import {
  MOCK_USERS,
  MOCK_CART_ITEMS,
  MOCK_PROMO_CODES,
  MOCK_ORDERS,
  MOCK_DELAY,
} from './mockData'

const delay = (ms = MOCK_DELAY) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK_SESSION_KEY = '__polar_mock_session__'

const saveMockSession = (user) => {
  try {
    sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user))
  } catch {
    // sessionStorage 存取失敗時靜默略過
  }
}

const loadMockSession = () => {
  try {
    const raw = sessionStorage.getItem(MOCK_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const clearMockSession = () => {
  try {
    sessionStorage.removeItem(MOCK_SESSION_KEY)
  } catch {
    // sessionStorage 清除失敗時靜默略過
  }
}

let currentUser = loadMockSession()

export const mockAuthHandlers = {
  login: async (email, password) => {
    await delay()
    const user = MOCK_USERS.find((candidate) => candidate.email === email)

    if (!user) {
      throw { status: 401, message: '找不到此帳號，請確認 Email 是否正確' }
    }

    if (user.password !== password) {
      throw { status: 401, message: '密碼錯誤，請重新輸入' }
    }

    const { password: _password, ...safeUser } = user
    void _password
    currentUser = safeUser
    saveMockSession(safeUser)
    return { customer: safeUser }
  },

  register: async (userData) => {
    await delay(800)
    const exists = MOCK_USERS.find((candidate) => candidate.email === userData.email)

    if (exists) {
      throw { status: 409, message: '此 Email 已被註冊' }
    }

    const newUser = {
      id: `mock-user-${Date.now()}`,
      ...userData,
      avatar: null,
      lineLinked: false,
      lineDisplayName: '',
      lineBoundAt: '',
      memberSince: new Date().toISOString().split('T')[0],
      points: 100,
      addresses: [],
    }

    const { password: _password, ...safeUser } = newUser
    void _password
    currentUser = safeUser
    return { customer: safeUser }
  },

  logout: async () => {
    await delay(300)
    currentUser = null
    clearMockSession()
    return { success: true }
  },

  getMe: async () => {
    await delay(400)
    const user = currentUser || loadMockSession()

    if (!user) {
      throw { status: 401, message: '尚未登入' }
    }

    currentUser = user
    return { customer: user }
  },

  updateProfile: async (data) => {
    await delay()
    const user = currentUser || loadMockSession()

    if (!user) {
      throw { status: 401, message: '請先登入' }
    }

    const updated = { ...user, ...data }
    currentUser = updated
    saveMockSession(updated)
    return { customer: updated }
  },

  changePassword: async (oldPassword, newPassword) => {
    await delay()
    void oldPassword
    void newPassword
    return { success: true }
  },

  requestPasswordReset: async (email) => {
    await delay(800)
    const user = MOCK_USERS.find((candidate) => candidate.email === email)

    if (!user) {
      throw { status: 404, message: '找不到此 Email 帳號' }
    }

    return { success: true }
  },
}

export const mockCartHandlers = {
  getCart: async () => {
    await delay(300)
    return { cart: { items: [...MOCK_CART_ITEMS] } }
  },

  addItem: async (variantId, quantity) => {
    await delay(400)
    void variantId
    void quantity
    return { success: true }
  },

  removeItem: async (lineItemId) => {
    await delay(400)
    void lineItemId
    return { success: true }
  },

  updateItem: async (lineItemId, quantity) => {
    await delay(400)
    void lineItemId
    void quantity
    return { success: true }
  },

  clearCart: async () => {
    await delay(300)
    return { success: true }
  },

  applyPromoCode: async (code) => {
    await delay()
    const promo = MOCK_PROMO_CODES[String(code).toUpperCase()]

    if (!promo) {
      throw { status: 422, message: '優惠碼無效或已過期' }
    }

    return promo
  },

  removePromoCode: async () => {
    await delay(300)
    return { success: true }
  },
}

export const mockOrderHandlers = {
  createOrder: async (payload) => {
    await delay(1000)

    if (payload.paymentMethod === 'transfer') {
      throw { status: 422, message: '測試環境暫不支援 ATM 付款，請改選信用卡或 LINE Pay' }
    }

    const orderId = `PL-${Date.now().toString().slice(-8)}`
    const newOrder = {
      id: orderId,
      status: 'processing',
      createdAt: new Date().toISOString(),
      ...payload,
      total: payload.total || 0,
    }

    MOCK_ORDERS[orderId] = newOrder
    return { order: newOrder }
  },

  getOrder: async (orderId) => {
    await delay()
    const order = MOCK_ORDERS[orderId]

    if (!order) {
      throw { status: 404, message: `找不到訂單：${orderId}` }
    }

    return { order }
  },

  getOrders: async () => {
    await delay()
    return { orders: Object.values(MOCK_ORDERS) }
  },

  validatePromoCode: async (code) => {
    await delay(600)
    const promo = MOCK_PROMO_CODES[String(code).toUpperCase()]

    if (!promo) {
      throw { status: 422, message: '優惠碼無效或已過期' }
    }

    return promo
  },
}

export const mockCustomerHandlers = {
  getAddresses: async () => {
    await delay(400)
    const user = currentUser || loadMockSession()
    if (!user) throw { status: 401, message: '請先登入' }
    return { addresses: user.addresses ?? [] }
  },

  createAddress: async (payload) => {
    await delay(500)
    const user = currentUser || loadMockSession()
    if (!user) throw { status: 401, message: '請先登入' }
    const newAddr = {
      id: `addr-${Date.now()}`,
      ...payload,
      isDefault: (user.addresses ?? []).length === 0,
    }
    const updated = { ...user, addresses: [...(user.addresses ?? []), newAddr] }
    currentUser = updated
    saveMockSession(updated)
    return { address: newAddr }
  },

  updateAddress: async (addressId, payload) => {
    await delay(500)
    const user = currentUser || loadMockSession()
    if (!user) throw { status: 401, message: '請先登入' }
    const addresses = (user.addresses ?? []).map(a =>
      a.id === addressId ? { ...a, ...payload } : a
    )
    const updated = { ...user, addresses }
    currentUser = updated
    saveMockSession(updated)
    return { address: addresses.find(a => a.id === addressId) }
  },

  deleteAddress: async (addressId) => {
    await delay(400)
    const user = currentUser || loadMockSession()
    if (!user) throw { status: 401, message: '請先登入' }
    const addresses = (user.addresses ?? []).filter(a => a.id !== addressId)
    const updated = { ...user, addresses }
    currentUser = updated
    saveMockSession(updated)
    return { success: true }
  },
}
