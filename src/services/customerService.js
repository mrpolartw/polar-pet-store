import { mockCustomerHandlers } from '../mocks/mockHandlers'
import authService from './authService'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

if (USE_MOCK && import.meta.env.PROD) {
  console.error('⚠️ customerService: MOCK MODE IS ACTIVE IN PRODUCTION!')
}

/**
 * 取得目前登入客戶的完整個人資料
 * @returns {Promise<{customer: object}>}
 */
export const getCustomerProfile = async () => {
  if (USE_MOCK) return authService.getMe()
  // TODO BACKEND: GET /store/customers/me
  throw new Error('TODO BACKEND: customerService.getCustomerProfile')
}

/**
 * 更新客戶個人資料
 * @param {object} data - 更新欄位 (name, phone, birthday, gender)
 * @returns {Promise<{customer: object}>}
 */
export const updateCustomerProfile = async (data) => {
  if (USE_MOCK) return authService.updateProfile(data)
  // TODO BACKEND: POST /store/customers/me
  throw new Error('TODO BACKEND: customerService.updateCustomerProfile')
}

/**
 * 取得客戶所有地址
 * @returns {Promise<{addresses: object[]}>}
 */
export const getAddresses = async () => {
  if (USE_MOCK) return mockCustomerHandlers.getAddresses()
  // TODO BACKEND: GET /store/customers/me/addresses
  throw new Error('TODO BACKEND: customerService.getAddresses')
}

/**
 * 新增地址
 * @param {object} payload - 地址資料 (name, phone, city, district, address, type, label, isDefault)
 * @returns {Promise<{address: object}>}
 */
export const createAddress = async (payload) => {
  if (USE_MOCK) return mockCustomerHandlers.createAddress(payload)
  // TODO BACKEND: POST /store/customers/me/addresses
  throw new Error('TODO BACKEND: customerService.createAddress')
}

/**
 * 更新地址
 * @param {string} addressId
 * @param {object} payload
 * @returns {Promise<{address: object}>}
 */
export const updateAddress = async (addressId, payload) => {
  if (USE_MOCK) return mockCustomerHandlers.updateAddress(addressId, payload)
  // TODO BACKEND: POST /store/customers/me/addresses/:addressId
  throw new Error('TODO BACKEND: customerService.updateAddress')
}

/**
 * 刪除地址
 * @param {string} addressId
 * @returns {Promise<{success: boolean}>}
 */
export const deleteAddress = async (addressId) => {
  if (USE_MOCK) return mockCustomerHandlers.deleteAddress(addressId)
  // TODO BACKEND: DELETE /store/customers/me/addresses/:addressId
  throw new Error('TODO BACKEND: customerService.deleteAddress')
}

const customerService = {
  getCustomerProfile,
  updateCustomerProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
}

export default customerService
