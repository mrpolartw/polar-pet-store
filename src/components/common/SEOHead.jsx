import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Mr.Polar 北極先生'
const DEFAULT_DESCRIPTION = 'Mr.Polar 北極先生，台灣優質寵物首席健康食品。天然食材、獸醫推薦、飼主合作共同設計、開發、打造最符合生活，給毛孩只給他需要的。'
const DEFAULT_OG_IMAGE = '/og-default.jpg'
const SITE_URL = 'https://mrpolar.com.tw'

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
  schema,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonical = canonicalUrl ? `${SITE_URL}${canonicalUrl}` : null

  return (
    <Helmet>
      {/* 基本 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Schema */}
      {schema && (Array.isArray(schema) ? schema : [schema]).map((s, i) =>
        s ? (
          <script key={i} type="application/ld+json">
            {JSON.stringify(s)}
          </script>
        ) : null
      )}
    </Helmet>
  )
}
