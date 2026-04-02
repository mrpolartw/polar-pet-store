import React from 'react'
import ImageWithFallback from '../common/ImageWithFallback'

const ProductGallery = ({ product, activeMedia, onSelectMedia }) => (
  <section className="pdp-gallery-card">
    <div className="pdp-gallery-main">
      <ImageWithFallback
        src={activeMedia}
        alt={product.name}
        className="pdp-gallery-image"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </div>

    <div className="pdp-gallery-thumbs">
      {product.gallery.map((media) => (
        <button
          key={media}
          type="button"
          className={`pdp-gallery-thumb ${activeMedia === media ? 'active' : ''}`}
          onClick={() => onSelectMedia(media)}
          aria-label={`查看 ${product.name} 圖片`}
        >
          <ImageWithFallback
            src={media}
            alt={product.name}
            className="pdp-gallery-thumb-image"
            loading="lazy"
            decoding="async"
          />
        </button>
      ))}
    </div>
  </section>
)

export default ProductGallery
