import React from 'react'
import { Star } from 'lucide-react'

const ProductReviews = ({ product }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">Social Proof</div>
      <h2>評價與社會證明</h2>
      <p>先用最常被提到的重點建立信任，再補上真實使用情境與感受。</p>
    </div>

    <div className="pdp-review-summary">
      <div className="pdp-review-rating">
        <span>{product.rating.toFixed(1)}</span>
        <div>
          <div className="pdp-rating-stars" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star key={value} size={16} className={value <= Math.round(product.rating) ? 'filled' : ''} />
            ))}
          </div>
          <p>{product.reviewCount} 則評價</p>
        </div>
      </div>

      <div className="pdp-review-keywords">
        {product.reviewKeywords.map((keyword) => (
          <span key={keyword}>{keyword}</span>
        ))}
      </div>
    </div>

    <div className="pdp-review-grid">
      {product.reviews.map((review) => (
        <article key={`${review.author}-${review.title}`} className="pdp-review-card">
          <div className="pdp-review-card-top">
            <div>
              <strong>{review.title}</strong>
              <p>{review.author} · {review.meta}</p>
            </div>
            <span>{review.rating}.0</span>
          </div>
          <p>{review.content}</p>
        </article>
      ))}
    </div>
  </section>
)

export default ProductReviews
