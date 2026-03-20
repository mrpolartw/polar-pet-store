/**
 * 會員相關 API
 * 包含個人資料、毛孩、收藏、序號、地址、擴充資料
 * 自訂路由使用 api-client.js，官方路由使用 sdk
 */

import { sdk } from "../lib/medusa"
import { del, get, post, put } from "../lib/api-client"

const CUSTOMER_FIELDS = ["first_name", "last_name", "email", "phone"]
const META_FIELDS = ["phone", "birthday", "gender"]

const pickFields = (source, fields) =>
  fields.reduce((result, field) => {
    if (source?.[field] !== undefined) {
      result[field] = source[field]
    }

    return result
  }, {})

const buildAddressPayload = (data = {}) => {
  const metadata = {
    ...(data.metadata || {}),
  }

  if (data.shipping_type || data.type) {
    metadata.shipping_type = data.shipping_type || data.type
  }

  if (data.store_name || data.storeName) {
    metadata.store_name = data.store_name || data.storeName
  }

  if (data.store_id || data.storeId) {
    metadata.store_id = data.store_id || data.storeId
  }

  const payload = {
    first_name: data.first_name || data.name,
    last_name: data.last_name,
    phone: data.phone,
    company: data.company,
    address_1: data.address_1 || data.address,
    address_2: data.address_2,
    city: data.city,
    country_code: data.country_code || "tw",
    province: data.province || data.district,
    postal_code: data.postal_code,
    address_name: data.address_name || data.label,
    is_default_shipping: data.is_default_shipping,
    is_default_billing: data.is_default_billing,
  }

  if (Object.keys(metadata).length > 0) {
    payload.metadata = metadata
  }

  return Object.entries(payload).reduce((result, [key, value]) => {
    if (value !== undefined) {
      result[key] = value
    }

    return result
  }, {})
}

const ensureCompleteAddress = (data = {}) => {
  const firstName = data.first_name || data.name
  const province = data.province || data.district
  const address1 = data.address_1 || data.address
  const shippingType = data.shipping_type || data.type

  if (
    !firstName ||
    !data.phone ||
    !data.city ||
    !province ||
    !address1 ||
    !shippingType
  ) {
    throw new Error("請填寫完整收件資訊")
  }
}

const getAddressFromCustomer = (customer, id) =>
  customer?.addresses?.find((address) => address.id === id) || null

const normalizeSerialNumber = (serialNumber) => serialNumber.trim().toUpperCase()

export const getCustomer = async () => {
  const { customer } = await sdk.store.customer.retrieve()

  return customer
}

export const updateCustomer = async (data = {}) => {
  const filteredData = pickFields(data, CUSTOMER_FIELDS)

  if (Object.keys(filteredData).length === 0) {
    return getCustomer()
  }

  const { customer } = await sdk.store.customer.update(filteredData)

  return customer
}

export const changePassword = async (newPassword) => {
  const token = localStorage.getItem("polar_token")

  if (!token) {
    throw new Error("請先登入後再更新密碼")
  }

  await sdk.auth.updateProvider(
    "customer",
    "emailpass",
    { password: newPassword },
    token
  )

  return { success: true }
}

export const getMeta = async () => {
  const response = await get("/store/customers/me/meta")

  return response?.data || null
}

export const updateMeta = async (data = {}) => {
  const filteredData = pickFields(data, META_FIELDS)
  const response = await put("/store/customers/me/meta", filteredData)

  return response?.data || null
}

export const getPets = async () => {
  const response = await get("/store/customers/me/pets")

  return response?.data || []
}

export const getPet = async (id) => {
  const response = await get(`/store/customers/me/pets/${id}`)

  return response?.data || null
}

export const createPet = async (data = {}) => {
  if (!data.name || !data.type || !data.gender) {
    throw new Error("請填寫毛孩名稱、種類與性別")
  }

  const response = await post("/store/customers/me/pets", data)

  return response?.data || null
}

export const updatePet = async (id, data = {}) => {
  const response = await put(`/store/customers/me/pets/${id}`, data)

  return response?.data || null
}

export const deletePet = async (id) => {
  await del(`/store/customers/me/pets/${id}`)

  return null
}

export const getWishlist = async () => {
  const response = await get("/store/customers/me/wishlist")

  return response?.data || []
}

export const addToWishlist = async (productId, variantId) => {
  const response = await post("/store/customers/me/wishlist", {
    product_id: productId,
    variant_id: variantId || null,
  })

  return response?.data || null
}

export const removeFromWishlist = async (id) => {
  await del(`/store/customers/me/wishlist/${id}`)

  return null
}

export const checkWishlist = async (productId) => {
  const response = await get(
    `/store/customers/me/wishlist/check?product_id=${encodeURIComponent(productId)}`
  )

  return response?.data || {
    is_in_wishlist: false,
    wishlist_item_id: null,
  }
}

export const getSerials = async () => {
  const response = await get("/store/customers/me/serials")

  return response?.data || []
}

export const registerSerial = async (serialNumber) => {
  const normalizedSerialNumber = normalizeSerialNumber(serialNumber)

  if (!/^[A-Z0-9]{8,20}$/.test(normalizedSerialNumber)) {
    throw new Error("序號格式不正確，請輸入 8-20 位大寫英數字")
  }

  const response = await post("/store/customers/me/serials", {
    serial_number: normalizedSerialNumber,
  })

  return response?.data || null
}

export const getAddresses = async () => {
  const { addresses } = await sdk.store.customer.listAddress()

  return addresses || []
}

export const createAddress = async (data = {}) => {
  ensureCompleteAddress(data)

  const { customer } = await sdk.store.customer.createAddress(
    buildAddressPayload(data)
  )

  return customer?.addresses?.[customer.addresses.length - 1] || null
}

export const updateAddress = async (id, data = {}) => {
  const { customer } = await sdk.store.customer.updateAddress(
    id,
    buildAddressPayload(data)
  )

  return getAddressFromCustomer(customer, id)
}

export const deleteAddress = async (id) => {
  await sdk.store.customer.deleteAddress(id)

  return null
}

export const setDefaultAddress = async (id) => {
  const addresses = await getAddresses()
  const targetAddress = addresses.find((address) => address.id === id)

  if (!targetAddress) {
    throw new Error("找不到地址資料")
  }

  for (const address of addresses) {
    const shouldBeDefault = address.id === id

    if (
      address.is_default_shipping !== shouldBeDefault ||
      address.is_default_billing !== shouldBeDefault
    ) {
      await sdk.store.customer.updateAddress(address.id, {
        is_default_shipping: shouldBeDefault,
        is_default_billing: shouldBeDefault,
      })
    }
  }

  const { address } = await sdk.store.customer.retrieveAddress(id)

  return address
}
