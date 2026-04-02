import React from 'react'
import ImageWithFallback from '../common/ImageWithFallback'

const ProductBenefits = ({ blocks }) => (
  <section className="pdp-stack-section">
    {blocks.map((block, index) => (
      <article key={block.title} className={`pdp-story-card ${index % 2 === 1 ? 'reverse' : ''}`}>
        <div className="pdp-story-media">
          <ImageWithFallback
            src={block.image}
            alt={block.title}
            className="pdp-story-image"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="pdp-story-copy">
          <div className="pdp-section-kicker">{block.eyebrow}</div>
          <h2>{block.title}</h2>
          <p>{block.description}</p>
        </div>
      </article>
    ))}
  </section>
)

export default ProductBenefits
