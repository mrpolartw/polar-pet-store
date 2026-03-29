import { sdk } from '../lib/medusa'

export const getOrders = async () => {
  const { orders } = await sdk.store.order.list({
    fields: '*items,*items.variant,*items.variant.product',
  })
  return { orders: orders || [] }
}

export const getOrder = async (orderId) => {
  const { order } = await sdk.store.order.retrieve(orderId, {
    fields: '*items,*items.variant,*items.variant.product',
  })
  return { order }
}

/**
 * 結帳前更新購物車的 email 與 metadata。
 * 必須在 createOrder 之前呼叫，讓 Medusa 訂單帶有聯絡資訊。
 *
 * @param {string} cartId
 * @param {{ email: string, buyerPhone: string, paymentMethod: string, checkoutPayload: object }} info
 */
export const prepareCart = async (cartId, { email, buyerPhone, paymentMethod, checkoutPayload }) => {
  await sdk.store.cart.update(cartId, {
    email,
    metadata: {
      buyer_phone:    buyerPhone,
      payment_method: paymentMethod,
      checkout_info:  checkoutPayload,
    },
  })
}

/**
 * 完成購物車以建立訂單（須在 prepareCart 後呼叫）。
 *
 * @param {string} cartId
 * @returns {{ order: object }}
 */
export const createOrder = async (cartId) => {
  const result = await sdk.store.cart.complete(cartId)
  if (result.type !== 'order') {
    throw new Error('訂單建立失敗，請再試一次')
  }
  return { order: result.order }
}

export const validatePromoCode = async (code) => {
  void code
  throw new Error('促銷代碼功能尚未開放')
}

export default {
  prepareCart,
  createOrder,
  getOrder,
  getOrders,
  validatePromoCode,
}
