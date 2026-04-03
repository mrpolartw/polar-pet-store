// TODO: 遷移至 WooCommerce REST API
// GET /wp-json/wc/v3/orders?customer=<id>
// GET /wp-json/wc/v3/orders/<id>

export async function listMyOrders({ limit = 10, offset = 0 } = {}) {
  void limit, offset
  return { orders: [], count: 0 }
}

export async function retrieveOrder(id) {
  void id
  return null
}
