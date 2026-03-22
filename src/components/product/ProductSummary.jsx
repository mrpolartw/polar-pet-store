import React from 'react'
import { Heart, ShieldCheck, ShoppingCart, Star, Zap } from 'lucide-react'
import { formatPrice } from '../../data/productCatalog'

const ProductSummary = ({
  product,
  selectedVariant,
  quantity,
  onVariantChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  isFavorite,
  onToggleFavorite,
}) => {
  const currentPrice = selectedVariant?.price || product.price
  const savings = product.originalPrice ? product.originalPrice - currentPrice : 0

  return (
    <aside className="pdp-summary-card">
      <div className="pdp-summary-top">
        <div className="pdp-summary-copy">
          <div className="pdp-summary-kicker">Polar Product Detail</div>
          <h1>{product.name}</h1>
          <p>{product.usp}</p>
        </div>

        <button
          type="button"
          className={`pdp-favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          aria-label={isFavorite ? '取消收藏' : '加入收藏'}
        >
          <Heart size={18} />
        </button>
      </div>

      <div className="pdp-rating-row">
        <div className="pdp-rating-stars" aria-label={`評分 ${product.rating}`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star key={value} size={14} className={value <= Math.round(product.rating) ? 'filled' : ''} />
          ))}
        </div>
        <span>{product.rating.toFixed(1)}</span>
        <span>({product.reviewCount} 則評價)</span>
      </div>

      <p className="pdp-summary-description">{product.shortDescription}</p>

      <div className="pdp-price-block">
        <div>
          <div className="pdp-price">{formatPrice(currentPrice)}</div>
          {product.originalPrice && <div className="pdp-original-price">{formatPrice(product.originalPrice)}</div>}
        </div>
        {product.originalPrice && (
          <div className="pdp-price-saving">現省 {formatPrice(savings)}</div>
        )}
      </div>

      <div className="pdp-badge-row">
        {product.trustBadges.map((badge) => (
          <span key={badge} className="pdp-trust-badge">{badge}</span>
        ))}
      </div>

      <div className="pdp-control-group">
        <div className="pdp-control-label">規格選擇</div>
        <div className="pdp-variant-grid">
          {product.variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className={`pdp-variant-btn ${selectedVariant.id === variant.id ? 'active' : ''}`}
              onClick={() => onVariantChange(variant)}
            >
              <strong>{variant.label}</strong>
              <span>{variant.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pdp-control-group">
        <div className="pdp-control-label">數量</div>
        <div className="pdp-quantity-stepper">
          <button type="button" onClick={() => onQuantityChange(Math.max(1, quantity - 1))}>-</button>
          <span>{quantity}</span>
          <button type="button" onClick={() => onQuantityChange(quantity + 1)}>+</button>
        </div>
      </div>

      <div className="pdp-cta-row">
        <button type="button" className="btn-blue pdp-primary-btn" onClick={onAddToCart}>
          <ShoppingCart size={18} />
          加入購物車
        </button>
        <button type="button" className="pdp-secondary-btn" onClick={onBuyNow}>
          <Zap size={18} />
          立即購買
        </button>
      </div>

      <div className="pdp-trust-panel">
        <div className="pdp-trust-item">
          <ShieldCheck size={16} />
          <span>滿 NT$1,500 享免運，付款流程採 256-bit SSL 加密保護。</span>
        </div>
        <div className="pdp-trust-item">
          <ShieldCheck size={16} />
          <span>已選規格：{selectedVariant.label}，送出前可於購物車再次調整數量。</span>
        </div>
      </div>
    </aside>
  )
}

export default ProductSummary
