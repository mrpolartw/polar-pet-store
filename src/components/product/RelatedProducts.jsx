import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { formatPrice } from '../../data/productCatalog'
import ImageWithFallback from '../common/ImageWithFallback'

const RelatedProducts = ({ products, onAddToCart }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">Cross Sell</div>
      <h2>推薦商品</h2>
      <p>不是只有你可能也喜歡，而是更接近顧問式搭配邏輯的延伸建議。</p>
    </div>

    <div className="pdp-related-grid">
      {products.map((product) => (
        <article key={product.slug} className="pdp-related-card">
          <Link to={`/products/${product.slug}`} className="pdp-related-image-link">
            <ImageWithFallback src={product.image} alt={product.name} className="pdp-related-image" />
          </Link>
          <div className="pdp-related-body">
            <Link to={`/products/${product.slug}`} className="pdp-related-title">{product.name}</Link>
            <p>{product.usp}</p>
            <div className="pdp-related-footer">
              <strong>{formatPrice(product.price)}</strong>
              <button type="button" onClick={() => onAddToCart(product)}>
                <ShoppingCart size={16} />
                加入購物車
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
)

export default RelatedProducts
