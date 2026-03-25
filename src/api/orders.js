import { sdk } from '../lib/medusa'

export async function listMyOrders({ limit = 10, offset = 0 } = {}) {
  const { orders, count } = await sdk.store.order.list({ limit, offset })
  return { orders, count }
}

export async function retrieveOrder(id) {
  const { order } = await sdk.store.order.retrieve(id)
  return order
}
