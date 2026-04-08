/**
 * JSON-LD Schema 生成器
 * 用於 SEOHead 的 schema prop，讓 Google 顯示豐富摘要
 */

const SITE_URL = 'https://mrpolar.com.tw'
const BRAND_NAME = 'Mr.Polar 北極先生'
const LOGO_URL = 'https://mrpolar.com.tw/logo.png'

/**
 * 商品頁 Schema（Product + AggregateRating + Offer）
 * @param {object} product
 * @param {string} product.name
 * @param {string} product.description
 * @param {string|string[]} product.images
 * @param {number} product.price
 * @param {string} [product.sku]
 * @param {number} [product.rating]
 * @param {number} [product.reviewCount]
 * @param {'InStock'|'OutOfStock'|'Discontinued'} [product.availability]
 * @returns {object}
 */
export function buildProductSchema(product) {
  if (!product) return null

  const images = Array.isArray(product.images)
    ? product.images
    : [product.image ?? product.images].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.subtitle ?? '',
    image: images,
    sku: product.sku ?? product.id ?? '',
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug ?? product.id}`,
      priceCurrency: 'TWD',
      price: product.price,
      availability: `https://schema.org/${product.availability ?? 'InStock'}`,
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
      },
    },
    ...(product.rating && product.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }
}

/**
 * 麵包屑 Schema（BreadcrumbList）
 * @param {Array<{name: string, url: string}>} items
 * @returns {object}
 */
export function buildBreadcrumbSchema(items) {
  if (!items?.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

/**
 * 網站 Schema（WebSite + SearchAction）
 * @returns {object}
 */
export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * 品牌 Schema（Organization）
 * @returns {object}
 */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+886-9-5448-000',
      contactType: 'customer service',
      availableLanguage: 'Chinese',
    },
    sameAs: [
      'https://lin.ee/THZqvZ5r',
    ],
  }
}
