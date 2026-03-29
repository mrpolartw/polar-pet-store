import { sdk } from '../lib/medusa'

export async function listProducts({ category_id, q, limit = 12, offset = 0 } = {}) {
  let region_id = undefined;
  try {
    const { regions } = await sdk.store.region.list({ limit: 1 });
    if (regions?.length > 0) region_id = regions[0].id;
  } catch(e) { console.warn('Failed to fetch regions', e); }

  const params = { limit, offset, region_id }
  if (category_id) params.category_id = [category_id]
  if (q) params.q = q

  const { products, count } = await sdk.store.product.list(params)
  return { products, count }
}

export async function retrieveProduct(handle) {
  let region_id = undefined;
  try {
    const { regions } = await sdk.store.region.list({ limit: 1 });
    if (regions?.length > 0) region_id = regions[0].id;
  } catch(e) { console.warn('Failed to fetch regions', e); }

  const { products } = await sdk.store.product.list({ handle, region_id })
  if (!products?.length) throw new Error('Product not found')
  return products[0]
}
