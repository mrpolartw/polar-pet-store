import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
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
import './ProductDetail.css'

const ProductDetailContent = ({ product, onAddToCartItem, onBuyNowItem }) => {
  const navigate = useNavigate()
  const [activeMedia, setActiveMedia] = useState(product.gallery[0])
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleAddToCart = (targetProduct = product, variant = selectedVariant, nextQuantity = quantity) => {
    onAddToCartItem(targetProduct, variant || targetProduct.variants[0], nextQuantity)
  }

  const handleBuyNow = () => {
    onBuyNowItem(product, selectedVariant || product.variants[0], quantity)
    navigate('/checkout')
  }

  const relatedProducts = getRelatedProducts(product, 4)

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
  const product = getProductBySlug(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!product) {
    return (
      <main className="pdp-page">
        <div className="pdp-container">
          <section className="pdp-empty-state">
            <h1>找不到這個商品</h1>
            <p>目前沒有對應的商品內容，請回商品列表繼續瀏覽。</p>
            <Link to="/products" className="btn-blue pdp-empty-link">返回商品列表</Link>
          </section>
        </div>
      </main>
    )
  }

  const handleAddToCartItem = (targetProduct, variant, quantity) => {
    addToCart(createCartPayload(targetProduct, variant, quantity))
  }

  return (
    <ProductDetailContent
      key={slug}
      product={product}
      onAddToCartItem={handleAddToCartItem}
      onBuyNowItem={handleAddToCartItem}
    />
  )
}

export default ProductDetail
