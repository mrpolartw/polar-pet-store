import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import SEOHead from '../../components/common/SEOHead'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/useAuth'
import { useCart } from '../../context/useCart'
import {
  createCartPayload,
  getProductBySlug,
  getRelatedProducts,
} from '../../data/productCatalog'
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
import membershipService from '../../services/membershipService'
import analytics from '../../utils/analytics'
import { buildBreadcrumbSchema, buildProductSchema } from '../../utils/schema'
import './ProductDetail.css'

const ProductDetailContent = ({ product, onAddToCartItem, onBuyNowItem }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const [activeMedia, setActiveMedia] = useState(product.gallery[0])
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const favoriteProductId = useMemo(() => String(product.id), [product.id])

  useEffect(() => {
    setActiveMedia(product.gallery[0])
    setSelectedVariant(product.variants[0])
    setQuantity(1)
  }, [product])

  useEffect(() => {
    let active = true

    const loadFavoriteState = async () => {
      if (!user?.id) {
        setIsFavorite(false)
        return
      }

      try {
        const response = await membershipService.getCustomerFavorites()
        if (!active) return

        setIsFavorite(
          response.items.some((item) => String(item.productId) === favoriteProductId)
        )
      } catch {
        if (active) {
          setIsFavorite(false)
        }
      }
    }

    void loadFavoriteState()

    return () => {
      active = false
    }
  }, [favoriteProductId, user?.id])

  const handleAddToCart = (
    targetProduct = product,
    variant = selectedVariant,
    nextQuantity = quantity
  ) => {
    onAddToCartItem(targetProduct, variant || targetProduct.variants[0], nextQuantity)
  }

  const handleBuyNow = () => {
    onBuyNowItem(product, selectedVariant || product.variants[0], quantity)
    navigate('/checkout')
  }

  const handleToggleFavorite = async () => {
    if (!user?.id) {
      navigate('/login', {
        state: {
          from: `/products/${product.slug}`,
          message: '請先登入會員，才能使用收藏功能。',
        },
      })
      return
    }

    setFavoriteLoading(true)

    try {
      if (isFavorite) {
        await membershipService.removeCustomerFavorite(favoriteProductId)
        setIsFavorite(false)
        toast.success('已從收藏清單移除商品。')
      } else {
        await membershipService.addCustomerFavorite({
          productId: favoriteProductId,
          variantId: selectedVariant?.id ? String(selectedVariant.id) : null,
        })
        setIsFavorite(true)
        toast.success('已加入收藏商品。')
      }
    } catch (error) {
      toast.error(error?.message || '收藏操作失敗，請稍後再試。')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const relatedProducts = getRelatedProducts(product, 4)

  return (
    <main className="pdp-page">
      <div className="pdp-container">
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">首頁</Link>
          <ChevronRight size={14} />
          <Link to="/products">所有商品</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </nav>

        <section className="pdp-hero">
          <ProductGallery
            product={product}
            activeMedia={activeMedia}
            onSelectMedia={setActiveMedia}
          />
          <ProductSummary
            product={product}
            selectedVariant={selectedVariant}
            quantity={quantity}
            onVariantChange={setSelectedVariant}
            onQuantityChange={setQuantity}
            onAddToCart={() => handleAddToCart()}
            onBuyNow={handleBuyNow}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            favoriteLoading={favoriteLoading}
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
          onAddToCart={(targetProduct) =>
            handleAddToCart(targetProduct, targetProduct.variants[0], 1)
          }
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
  const product = getProductBySlug(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    if (product) {
      analytics.viewItem(product)
    }
  }, [product])

  if (!product) {
    return (
      <main className="pdp-page">
        <div className="pdp-container">
          <section className="pdp-empty-state">
            <h1>找不到這個商品</h1>
            <p>商品可能已下架、搬移，或連結網址有誤，請回到商品列表繼續選購。</p>
            <Link to="/products" className="btn-blue pdp-empty-link">
              返回商品列表
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const handleAddToCartItem = (targetProduct, variant, nextQuantity) => {
    addToCart(createCartPayload(targetProduct, variant, nextQuantity))
  }

  return (
    <>
      <SEOHead
        title={product?.name}
        description={product?.description ?? product?.subtitle}
        ogImage={product?.images?.[0] ?? product?.image}
        ogType="product"
        canonicalUrl={`/products/${product?.slug ?? product?.id}`}
        schema={[
          buildProductSchema(product),
          buildBreadcrumbSchema([
            { name: '首頁', url: '/' },
            { name: '所有商品', url: '/products' },
            { name: product?.name ?? '', url: `/products/${product?.slug ?? product?.id}` },
          ]),
        ]}
      />
      <ProductDetailContent
        key={slug}
        product={product}
        onAddToCartItem={handleAddToCartItem}
        onBuyNowItem={handleAddToCartItem}
      />
    </>
  )
}

export default ProductDetail
