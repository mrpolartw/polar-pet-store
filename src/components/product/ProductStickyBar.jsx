import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { formatPrice } from '../../data/productCatalog'

const ProductStickyBar = ({ product, selectedVariant, quantity, onAddToCart, onBuyNow }) => (
  <div className="pdp-sticky-bar">
    <div className="pdp-sticky-copy">
      <strong>{formatPrice(selectedVariant?.price || product.price)}</strong>
      <span>{selectedVariant?.label} × {quantity}</span>
    </div>
    <div className="pdp-sticky-actions">
      <button type="button" className="pdp-sticky-secondary" onClick={onAddToCart}>
        <ShoppingCart size={16} />
      </button>
      <button type="button" className="btn-blue pdp-sticky-primary" onClick={onBuyNow}>
        立即購買
      </button>
    </div>
  </div>
)

export default ProductStickyBar
