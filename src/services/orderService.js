// TODO: 遷移至 WooCommerce REST API
// WooCommerce 訂單：POST /wp-json/wc/v3/orders
// 付款：透過 WooCommerce Payment Gateways 或 PayUni custom endpoint

export const getOrders = async () => {
  return { orders: [] }
}

export const getOrder = async (_orderId) => {
  return { order: null }
}

export const prepareCart = async (_cartId, _payload) => {
  // TODO: WooCommerce 結帳流程
}

export const createOrder = async (_cartId) => {
  throw new Error('訂單功能尚待遷移至 WooCommerce，請稍後')
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
