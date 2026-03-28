/**
 * @fileoverview Polar Pet Store — API 型別定義（JSDoc）
 * 後端串接時參考此檔案確認 request / response 結構
 * VITE_USE_MOCK=false 後，各 service 的 throw Error 替換為 apiClient 呼叫
 */

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} [phone]
 * @property {'male'|'female'|'other'|''} [gender]
 * @property {string} [birthday] - YYYY-MM-DD
 * @property {string|null} avatar
 * @property {boolean} lineLinked
 * @property {string} lineDisplayName
 * @property {string} memberSince - YYYY-MM-DD
 * @property {number} points
 * @property {Address[]} addresses
 */

/**
 * @typedef {object} Address
 * @property {string} id
 * @property {'home'|'711'} type
 * @property {string} label
 * @property {string} name
 * @property {string} phone
 * @property {string} [city]
 * @property {string} [district]
 * @property {string} [address]
 * @property {string} [storeName]
 * @property {string} [storeId]
 * @property {boolean} isDefault
 */

/**
 * @typedef {object} CartItem
 * @property {string} id - `${productId}-${variantId}`
 * @property {string} productId
 * @property {string} variantId
 * @property {string} name
 * @property {string} image
 * @property {string} specs - 規格文字（e.g. "15g x 30入"）
 * @property {number} price
 * @property {number} quantity
 * @property {string[]} shippingMethods - e.g. ['home', '7-ELEVEN']
 */

/**
 * @typedef {object} Product
 * @property {number} id
 * @property {string} slug
 * @property {string} name
 * @property {'food'|'snacks'|'health'|'supplies'} category
 * @property {'cat'|'dog'} petType
 * @property {number} price
 * @property {number|null} originalPrice
 * @property {string} specs
 * @property {number} rating
 * @property {number} reviewCount
 * @property {boolean} isBestseller
 * @property {boolean} isNew
 * @property {boolean} isBundle
 * @property {string} image
 * @property {string[]} images
 * @property {ProductVariant[]} variants
 */

/**
 * @typedef {object} ProductVariant
 * @property {string} id
 * @property {string} label
 * @property {number} price
 * @property {string} [description]
 */

/**
 * @typedef {object} Order
 * @property {string} id - e.g. 'PL-20260001'
 * @property {'processing'|'shipped'|'delivered'|'cancelled'} status
 * @property {string} createdAt - ISO 8601
 * @property {CartItem[]} items
 * @property {number} subtotal
 * @property {number} shippingFee
 * @property {number} discount
 * @property {number} total
 * @property {'home'|'store'} shippingMethod
 * @property {'credit'|'linepay'|'transfer'} paymentMethod
 * @property {{name: string, phone: string}} recipient
 * @property {string} [promoCode]
 */

/**
 * @typedef {object} ApiSuccessResponse
 * @property {true} success
 */

/**
 * @typedef {object} ApiError
 * @property {number} status - HTTP status code
 * @property {string} message
 */

/**
 * AUTH API ENDPOINTS
 * POST /store/auth          → login(email, password)
 * POST /store/auth/register → register(userData)
 * DELETE /store/auth        → logout()
 * GET  /store/auth/me       → getMe()
 * POST /store/auth/change-password → changePassword(old, new)
 * POST /store/auth/password-reset  → requestPasswordReset(email)
 *
 * CART API ENDPOINTS
 * GET  /store/carts         → getCart()
 * POST /store/carts/items   → addItem(variantId, quantity)
 * DELETE /store/carts/items/:lineItemId → removeItem(lineItemId)
 * PUT  /store/carts/items/:lineItemId   → updateItem(lineItemId, quantity)
 * DELETE /store/carts       → clearCart()
 * POST /store/carts/promo-codes → applyPromoCode(code)
 * DELETE /store/carts/promo-codes → removePromoCode()
 *
 * ORDER API ENDPOINTS
 * POST /store/orders        → createOrder(payload)
 * GET  /store/orders        → getOrders()
 * GET  /store/orders/:id    → getOrder(orderId)
 *
 * CUSTOMER API ENDPOINTS
 * GET  /store/customers/me  → getCustomerProfile()
 * POST /store/customers/me  → updateCustomerProfile(data)
 * GET  /store/customers/me/addresses → getAddresses()
 * POST /store/customers/me/addresses → createAddress(payload)
 * POST /store/customers/me/addresses/:id → updateAddress(id, payload)
 * DELETE /store/customers/me/addresses/:id → deleteAddress(id)
 */

export default {}
