import { store } from '../lib/woocommerce'

export async function listProducts({ category_id, q, limit = 12, offset = 0 } = {}) {
  const params = { per_page: limit, page: Math.floor(offset / limit) + 1 }
  if (category_id) params.category = category_id
  if (q) params.search = q

  const products = await store.products.list(params)
  return { products: products || [], count: products?.length || 0 }
}

export async function retrieveProduct(slug) {
  const products = await store.products.list({ slug })
  if (!products?.length) throw new Error('Product not found')
  return products[0]
}
