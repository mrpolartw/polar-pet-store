import React from 'react'
import { Heart, ShieldCheck, ShoppingCart, Star, Zap } from 'lucide-react'
import { formatPrice } from '../../utils/formatters'

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
          <div className="pdp-summary-kicker">為毛孩準備的</div>
          <h1>{product.name}</h1>
          <p>{product.usp}</p>
        </div>

        <button
          type="button"
          className={`pdp-favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          aria-label={isFavorite ? '從收藏中移除' : '收藏這款'}
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
        <span>({product.reviewCount} 位飼主評價)</span>
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
        <div className="pdp-control-label">選擇規格</div>
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
        <div className="pdp-control-label">購買數量</div>
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
          <span>滿 NT$1,500 免運到家</span>
        </div>
        <div className="pdp-trust-item">
          <ShieldCheck size={16} />
          <span>7 天鑑賞期，不滿意告訴我們</span>
        </div>
      </div>
    </aside>
  )
}

export default ProductSummary
