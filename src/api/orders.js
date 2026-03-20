/**
 * 訂單相關 API
 */
import { sdk } from "../lib/medusa"
import { clearCartId } from "./cart"

export const getCustomerOrders = async ({ limit = 10, offset = 0 } = {}) => {
  const { orders, count } = await sdk.store.order.list({ limit, offset })

  return { orders, count }
}

export const getOrder = async (id) => {
  const { order } = await sdk.store.order.retrieve(id)

  return order
}

export const completeCart = async (cartId) => {
  const response = await sdk.store.cart.complete(cartId)

  if (response.type !== "order") {
    throw new Error(response.error?.message || "訂單建立失敗")
  }

  clearCartId()

  return response.order
}
