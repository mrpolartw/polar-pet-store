import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Home, ShoppingBag, Heart, Phone } from 'lucide-react'

import { ROUTES } from '../constants/routes'
import { PRODUCT_CATALOG } from '../data/productCatalog'
import { formatPrice } from '../utils/formatters'
import ImageWithFallback from '../components/common/ImageWithFallback'
import './NotFound.css'

const FEATURED_PRODUCTS = PRODUCT_CATALOG
  .filter((product) => product.isBestseller)
  .slice(0, 3)

const QUICK_LINKS = [
  { icon: Home, label: '首頁', to: ROUTES.HOME },
  { icon: ShoppingBag, label: '所有商品', to: ROUTES.PRODUCTS },
  { icon: Heart, label: '關節保健', to: ROUTES.JOINTS },
  { icon: Phone, label: '聯絡我們', to: ROUTES.CONTACT },
]

export default function NotFound() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (event) => {
    event.preventDefault()

    if (query.trim()) {
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <main className="nf-page">
      <section className="nf-hero">
        <div className="nf-illustration" aria-hidden="true">
        </div>

        <h1 className="nf-title headline-pro">這一頁好像走丟了......</h1>
        <p className="nf-desc">
          沒關係，毛孩的好東西都還在，
          <br />
          讓我們帶你回去。
        </p>

        <div className="nf-cta-row">
          <Link to={ROUTES.HOME} className="btn-blue nf-btn-primary">
            <Home size={16} style={{ marginRight: 8 }} />
            回到首頁
          </Link>
          <Link to={ROUTES.PRODUCTS} className="nf-btn-secondary">
            <ShoppingBag size={16} style={{ marginRight: 8 }} />
            瀏覽所有商品
          </Link>
        </div>
      </section>

      <section className="nf-search-section">
        <form className="nf-search-form" onSubmit={handleSearch}>
          <div className="nf-search-wrapper">
            <Search size={18} className="nf-search-icon" />
            <input
              type="text"
              className="nf-search-input"
              placeholder="搜尋關節保健、腸胃保健…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="搜尋商品"
            />
            {query.trim() && (
              <button type="submit" className="nf-search-btn">
                搜尋
              </button>
            )}
          </div>
        </form>
      </section>

      {FEATURED_PRODUCTS.length > 0 && (
        <section className="nf-recommended">
          <div className="nf-section-head">
            <h2 className="nf-section-title">或許你在找這些？</h2>
            <p className="nf-section-desc">北極先生為你的毛孩精選推薦</p>
          </div>
          <div className="nf-product-grid">
            {FEATURED_PRODUCTS.map((product) => (
              <Link
                key={product.slug}
                to={`${ROUTES.PRODUCTS}/${product.slug}`}
                className="nf-product-card"
              >
                <div className="nf-product-image-wrap">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="nf-product-image"
                  />
                </div>
                <div className="nf-product-body">
                  <p className="nf-product-name">{product.name}</p>
                  <p className="nf-product-usp">{product.usp}</p>
                  <strong className="nf-product-price">
                    {formatPrice(product.price)}
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="nf-quick-links">
        <div className="nf-quick-grid">
          {QUICK_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="nf-quick-card">
              <div className="nf-quick-icon">
                <item.icon size={22} />
              </div>
              <span className="nf-quick-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
