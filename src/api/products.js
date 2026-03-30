import { PRODUCT_CATALOG, getProductBySlug as getLocalProductBySlug } from '../data/productCatalog'
import { sdk } from '../lib/medusa'

const TAIWAN_COUNTRY_CODES = new Set(['tw', 'twn'])

let regionPromise = null

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function getVariantPrice(variant) {
  if (variant?.calculated_price?.calculated_amount) {
    return Number(variant.calculated_price.calculated_amount)
  }

  if (Array.isArray(variant?.prices) && variant.prices.length > 0) {
    const twdPrice = variant.prices.find((price) => normalizeText(price.currency_code) === 'twd')
    if (twdPrice) return Number(twdPrice.amount)

    return Number(variant.prices[0].amount || 0)
  }

  return Number(variant?.price || 0)
}

function getVariantLabel(variant, fallbackLabel = 'Default') {
  const optionValues = Array.isArray(variant?.options)
    ? variant.options
        .map((option) => option?.value)
        .filter(Boolean)
    : []

  if (optionValues.length > 0) {
    return optionValues.join(' / ')
  }

  return variant?.title || fallbackLabel
}

function normalizeRemoteProduct(remoteProduct, regionId = null) {
  const variants = Array.isArray(remoteProduct?.variants)
    ? remoteProduct.variants.map((variant, index) => ({
        id: variant.id,
        variantId: variant.id,
        label: getVariantLabel(variant, `Variant ${index + 1}`),
        price: getVariantPrice(variant),
        description: variant.title || '',
      }))
    : []

  const primaryImage = remoteProduct?.thumbnail || remoteProduct?.images?.[0]?.url || ''
  const images = Array.isArray(remoteProduct?.images)
    ? remoteProduct.images
        .map((image) => image?.url)
        .filter(Boolean)
    : []

  return {
    id: remoteProduct.id,
    remoteId: remoteProduct.id,
    slug: remoteProduct.handle,
    name: remoteProduct.title,
    category: 'all',
    petType: 'all',
    price: variants[0]?.price || 0,
    specs: remoteProduct.subtitle || '',
    rating: 4,
    reviewCount: 0,
    isBestseller: false,
    isNew: false,
    isBundle: false,
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage].filter(Boolean),
    gallery: images.length > 0 ? images : [primaryImage].filter(Boolean),
    usp: remoteProduct.subtitle || '',
    shortDescription: remoteProduct.description || '',
    trustBadges: [],
    storyBlocks: [],
    ingredientsTitle: '',
    ingredientsIntro: '',
    ingredients: [],
    exclusions: [],
    sourceNote: '',
    nutritionSectionTitle: '',
    nutritionSectionIntro: '',
    nutritionHighlights: [],
    nutritionFacts: [],
    suitability: [],
    reviews: [],
    reviewKeywords: [],
    guide: {},
    faqs: [],
    variants,
    isPurchasable: variants.some((variant) => Boolean(variant.variantId)),
    regionId,
  }
}

function findVariantMatch(localVariant, remoteVariants, index) {
  const directMatch = remoteVariants.find(
    (variant) =>
      normalizeText(variant.label) === normalizeText(localVariant.label)
      || normalizeText(variant.id) === normalizeText(localVariant.id),
  )

  if (directMatch) return directMatch
  if (remoteVariants[index]) return remoteVariants[index]
  if (remoteVariants.length === 1) return remoteVariants[0]

  return null
}

function mergeProduct(localProduct, remoteProduct, regionId = null) {
  const normalizedRemote = remoteProduct ? normalizeRemoteProduct(remoteProduct, regionId) : null

  if (!localProduct && normalizedRemote) {
    return normalizedRemote
  }

  if (!localProduct) {
    return null
  }

  const remoteVariants = normalizedRemote?.variants || []
  const localVariants = Array.isArray(localProduct.variants) ? localProduct.variants : []

  const mergedVariants = localVariants.length > 0
    ? localVariants.map((variant, index) => {
        const match = findVariantMatch(variant, remoteVariants, index)

        return {
          ...variant,
          id: match?.variantId || variant.id,
          variantId: match?.variantId || variant.variantId || null,
          price: match?.price ?? variant.price,
          description: variant.description || match?.description || '',
        }
      })
    : remoteVariants

  return {
    ...localProduct,
    remoteId: normalizedRemote?.remoteId || null,
    regionId: normalizedRemote?.regionId || regionId || null,
    price: normalizedRemote?.price ?? localProduct.price,
    image: localProduct.image || normalizedRemote?.image || '',
    images: Array.isArray(localProduct.images) && localProduct.images.length > 0
      ? localProduct.images
      : (normalizedRemote?.images || []),
    gallery: Array.isArray(localProduct.gallery) && localProduct.gallery.length > 0
      ? localProduct.gallery
      : (normalizedRemote?.gallery || []),
    variants: mergedVariants,
    isPurchasable: mergedVariants.some((variant) => Boolean(variant.variantId)),
  }
}

function chooseTaiwanRegion(regions = []) {
  return (
    regions.find((region) =>
      normalizeText(region.currency_code) === 'twd'
      || region.countries?.some((country) =>
        TAIWAN_COUNTRY_CODES.has(normalizeText(country?.iso_2 || country?.code)),
      ),
    )
    || regions[0]
    || null
  )
}

function buildMergedCatalog(remoteProducts = [], regionId = null) {
  const remoteByHandle = new Map(
    remoteProducts
      .filter((product) => product?.handle)
      .map((product) => [product.handle, product]),
  )

  const mergedLocalProducts = PRODUCT_CATALOG
    .map((product) => mergeProduct(product, remoteByHandle.get(product.slug), regionId))
    .filter(Boolean)

  const extraRemoteProducts = remoteProducts
    .filter((product) => !PRODUCT_CATALOG.some((localProduct) => localProduct.slug === product.handle))
    .map((product) => normalizeRemoteProduct(product, regionId))

  return [...mergedLocalProducts, ...extraRemoteProducts]
}

export async function getStoreRegion() {
  if (!regionPromise) {
    regionPromise = sdk.store.region
      .list({ limit: 100 })
      .then(({ regions }) => chooseTaiwanRegion(regions))
      .catch((error) => {
        regionPromise = null
        throw error
      })
  }

  return regionPromise
}

export async function listProducts({ q, limit = 100, offset = 0 } = {}) {
  let region = null

  try {
    region = await getStoreRegion()
  } catch (error) {
    console.warn('Failed to resolve storefront region:', error)
  }

  const params = {
    limit: Math.max(limit, PRODUCT_CATALOG.length),
    offset,
  }

  if (region?.id) {
    params.region_id = region.id
  }

  if (q) {
    params.q = q
  }

  const { products, count } = await sdk.store.product.list(params)
  const mergedProducts = buildMergedCatalog(products || [], region?.id || null)

  return {
    products: mergedProducts,
    count: mergedProducts.length || count || 0,
  }
}

export async function retrieveProduct(handle) {
  const localProduct = getLocalProductBySlug(handle)
  let remoteProduct = null
  let regionId = null

  try {
    const region = await getStoreRegion()
    regionId = region?.id || null

    const { products } = await sdk.store.product.list({
      handle,
      ...(regionId ? { region_id: regionId } : {}),
    })

    remoteProduct = products?.[0] || null
  } catch (error) {
    console.warn(`Failed to retrieve remote product for handle "${handle}":`, error)
  }

  const mergedProduct = mergeProduct(localProduct, remoteProduct, regionId)

  if (!mergedProduct) {
    throw new Error('Product not found')
  }

  return mergedProduct
}

export async function retrieveProductsBySlugs(slugs = []) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))]

  if (uniqueSlugs.length === 0) {
    return []
  }

  let regionId = null
  let remoteProducts = []

  try {
    const region = await getStoreRegion()
    regionId = region?.id || null

    const { products } = await sdk.store.product.list({
      limit: Math.max(uniqueSlugs.length, PRODUCT_CATALOG.length),
      ...(regionId ? { region_id: regionId } : {}),
    })

    remoteProducts = products || []
  } catch (error) {
    console.warn('Failed to retrieve related remote products:', error)
  }

  const remoteByHandle = new Map(remoteProducts.map((product) => [product.handle, product]))

  return uniqueSlugs
    .map((slug) => mergeProduct(getLocalProductBySlug(slug), remoteByHandle.get(slug), regionId))
    .filter(Boolean)
}
