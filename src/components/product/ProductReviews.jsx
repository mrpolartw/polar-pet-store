import React from 'react'
import { Star } from 'lucide-react'

const ProductReviews = ({ product }) => (
  <section className="pdp-section-card">
    <div className="pdp-section-head">
      <div className="pdp-section-kicker">其他飼主說</div>
      <h2>飼主說的</h2>
      <p>來自真實購買者的回饋，未經篩選。</p>
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
          <p>{product.reviewCount} 位飼主評價</p>
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
