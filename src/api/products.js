import { sdk } from '../lib/medusa'

export async function listProducts({ category_id, q, limit = 12, offset = 0 } = {}) {
  const params = { limit, offset }
  if (category_id) params.category_id = [category_id]
  if (q) params.q = q

  const { products, count } = await sdk.store.product.list(params)
  return { products, count }
}

export async function retrieveProduct(handle) {
  const { products } = await sdk.store.product.list({ handle })
  if (!products?.length) throw new Error('Product not found')
  return products[0]
}
