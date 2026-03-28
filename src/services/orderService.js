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

export const createOrder = async (payload) => {
  const { order } = await sdk.store.cart.complete(payload.cartId)
  return { order }
}

export const validatePromoCode = async (code) => {
  void code
  throw new Error('促銷代碼功能尚未開放')
}

export default {
  createOrder,
  getOrder,
  getOrders,
  validatePromoCode,
}
