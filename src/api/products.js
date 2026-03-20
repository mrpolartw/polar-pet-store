import { sdk } from "../lib/medusa"

export const getProducts = async ({ limit = 20, offset = 0, category_id } = {}) => {
  const params = { limit, offset }
  if (category_id) params.category_id = [category_id]
  try {
    const { products, count } = await sdk.store.product.list(params)
    return { products: products || [], count: count || 0 }
  } catch (e) {
    console.error("[getProducts error]", e)
    return { products: [], count: 0 }
  }
}

export const getProduct = async (handle) => {
  try {
    const { products } = await sdk.store.product.list({ handle })
    return products?.[0] || null
  } catch {
    return null
  }
}

export const searchProducts = async (query) => {
  if (!query?.trim()) return { products: [], count: 0 }
  try {
    const { products, count } = await sdk.store.product.list({ q: query, limit: 10 })
    return { products: products || [], count: count || 0 }
  } catch {
    return { products: [], count: 0 }
  }
}
