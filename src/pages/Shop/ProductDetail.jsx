import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { LoadingSpinner, ErrorState, SEOHead } from '../../components/common'
import { retrieveProduct, retrieveProductsBySlugs } from '../../api/products'
import { useCart } from '../../context/useCart'
import { createCartPayload, getRelatedProducts } from '../../data/productCatalog'
import { buildProductSchema, buildBreadcrumbSchema } from '../../utils/schema'
import analytics from '../../utils/analytics'
import ProductBenefits from '../../components/product/ProductBenefits'
import ProductFAQ from '../../components/product/ProductFAQ'
import ProductFeedingGuide from '../../components/product/ProductFeedingGuide'
import ProductGallery from '../../components/product/ProductGallery'
import ProductIngredients from '../../components/product/ProductIngredients'
import ProductNutrition from '../../components/product/ProductNutrition'
import ProductReviews from '../../components/product/ProductReviews'
import ProductStickyBar from '../../components/product/ProductStickyBar'
import ProductSuitability from '../../components/product/ProductSuitability'
import ProductSummary from '../../components/product/ProductSummary'
import RelatedProducts from '../../components/product/RelatedProducts'
import './ProductDetail.css'

const ProductDetailContent = ({ product, relatedProducts, onAddToCartItem, onBuyNowItem }) => {
  const navigate = useNavigate()
  const [activeMedia, setActiveMedia] = useState(product.gallery[0])
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    setActiveMedia(product.gallery[0])
    setSelectedVariant(product.variants[0])
    setQuantity(1)
  }, [product])

  const handleAddToCart = (targetProduct = product, variant = selectedVariant, nextQuantity = quantity) => {
    onAddToCartItem(targetProduct, variant || targetProduct.variants[0], nextQuantity)
  }

  const handleBuyNow = () => {
    onBuyNowItem(product, selectedVariant || product.variants[0], quantity)
    navigate('/checkout')
  }

  return (
    <main className="pdp-page">
      <div className="pdp-container">
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">首頁</Link>
          <ChevronRight size={14} />
          <Link to="/products">商品列表</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </nav>

        <section className="pdp-hero">
          <ProductGallery product={product} activeMedia={activeMedia} onSelectMedia={setActiveMedia} />
          <ProductSummary
            product={product}
            selectedVariant={selectedVariant}
            quantity={quantity}
            onVariantChange={setSelectedVariant}
            onQuantityChange={setQuantity}
            onAddToCart={() => handleAddToCart()}
            onBuyNow={handleBuyNow}
            isFavorite={isFavorite}
            onToggleFavorite={() => setIsFavorite((prev) => !prev)}
          />
        </section>

        <ProductBenefits blocks={product.storyBlocks} />
        <ProductIngredients product={product} />
        <ProductNutrition product={product} />
        <ProductSuitability items={product.suitability} />
        <ProductReviews product={product} />
        <ProductFeedingGuide guide={product.guide} />
        <ProductFAQ faqs={product.faqs} />
        <RelatedProducts
          products={relatedProducts}
          onAddToCart={(targetProduct) => handleAddToCart(targetProduct, targetProduct.variants[0], 1)}
        />
      </div>

      <ProductStickyBar
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        onAddToCart={() => handleAddToCart()}
        onBuyNow={handleBuyNow}
      />
    </main>
  )
}

const ProductDetail = () => {
  const { slug } = useParams()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    let isMounted = true

    const loadProduct = async () => {
      setIsLoading(true)
      setError('')

      try {
        const nextProduct = await retrieveProduct(slug)
        const relatedSlugs = getRelatedProducts(nextProduct, 4).map((item) => item.slug)
        const nextRelatedProducts = await retrieveProductsBySlugs(relatedSlugs)

        if (!isMounted) return

        setProduct(nextProduct)
        setRelatedProducts(nextRelatedProducts)
      } catch (err) {
        if (!isMounted) return

        setProduct(null)
        setRelatedProducts([])
        setError(err?.message || '找不到商品')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (slug) {
      loadProduct()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  useEffect(() => {
    if (product) {
      analytics.viewItem(product)
    }
  }, [product])

  const handleAddToCartItem = (targetProduct, variant, quantity) => {
    addToCart(createCartPayload(targetProduct, variant, quantity))
  }

  if (isLoading) {
    return (
      <main className="pdp-page">
        <div className="pdp-container" style={{ paddingBlock: 80 }}>
          <LoadingSpinner size="large" label="商品載入中..." />
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="pdp-page">
        <div className="pdp-container">
          <section className="pdp-empty-state">
            <ErrorState message={error || '找不到商品'} />
            <Link to="/products" className="btn-blue pdp-empty-link">
              返回商品列表
            </Link>
          </section>
        </div>
      </main>
    )
  }

  return (
    <>
      <SEOHead
        title={product.name}
        description={product.description ?? product.subtitle ?? product.shortDescription}
        ogImage={product.images?.[0] ?? product.image}
        ogType="product"
        canonicalUrl={`/products/${product.slug ?? product.id}`}
        schema={[
          buildProductSchema(product),
          buildBreadcrumbSchema([
            { name: '首頁', url: '/' },
            { name: '商品列表', url: '/products' },
            { name: product.name, url: `/products/${product.slug ?? product.id}` },
          ]),
        ]}
      />
      <ProductDetailContent
        key={slug}
        product={product}
        relatedProducts={relatedProducts}
        onAddToCartItem={handleAddToCartItem}
        onBuyNowItem={handleAddToCartItem}
      />
    </>
  )
}

export default ProductDetail
