import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  LayoutList,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react'
import { useCart } from '../../context/useCart'
import {
  CATEGORIES,
  PET_TYPES,
  PRICE_RANGES,
  PRODUCT_CATALOG,
  PRODUCT_FILTERS,
  SORT_OPTIONS,
  createCartPayload,
  formatPrice,
} from '../../data/productCatalog'
import './Products.css'

const PER_PAGE = 12

function StarRating({ rating }) {
  return (
    <div className="prod-stars">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={13}
          className={value <= Math.round(rating) ? 'star-filled' : 'star-empty'}
        />
      ))}
      <span className="prod-rating-num">{rating.toFixed(1)}</span>
    </div>
  )
}

function ProductCard({ product, viewMode, onAddToCart }) {
  const [isAdded, setIsAdded] = useState(false)

  const handleAddClick = () => {
    onAddToCart(product)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1800)
  }

  const discountPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null
  const catLabel = CATEGORIES.find((item) => item.key === product.category)
  const petLabel = PET_TYPES.find((item) => item.key === product.petType)

  if (viewMode === 'list') {
    return (
      <div className="prod-card-list">
        <Link to={`/products/${product.slug}`} className="prod-card-list-img-link">
          <div className="prod-card-list-img-wrap">
            <img src={product.image} alt={product.name} className="prod-card-list-img" />
            {discountPct && <span className="prod-badge discount">-{discountPct}%</span>}
          </div>
        </Link>
        <div className="prod-card-list-body">
          <div className="prod-card-list-top">
            <div className="prod-meta-row">
              <span className="prod-cat-badge">{catLabel?.label}</span>
              <span className="prod-pet-badge">{petLabel?.label}</span>
              {product.isBestseller && <span className="prod-badge bestseller">熱銷</span>}
              {product.isNew && <span className="prod-badge new-item">新品</span>}
              {product.isBundle && <span className="prod-badge new-item">組合</span>}
            </div>
            <Link to={`/products/${product.slug}`} className="prod-name-link">
              <h3 className="prod-name">{product.name}</h3>
            </Link>
            <p className="prod-specs">{product.specs}</p>
            <p className="prod-usp">{product.usp}</p>
            <div className="prod-rating-row">
              <StarRating rating={product.rating} />
              <span className="prod-review-count">{product.reviewCount} 則評價</span>
            </div>
          </div>
          <div className="prod-card-list-bottom">
            <div className="prod-price-block">
              <span className="prod-price">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="prod-original-price">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            <div className="prod-card-actions">
              <Link to={`/products/${product.slug}`} className="prod-detail-link">
                查看詳情
              </Link>
              <button
                type="button"
                className={`btn-blue prod-add-btn ${isAdded ? 'added' : ''}`}
                onClick={handleAddClick}
              >
                {isAdded ? <><Check size={16} /> 已加入</> : <><ShoppingCart size={16} /> 加入購物車</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="prod-card">
      <Link to={`/products/${product.slug}`} className="prod-card-img-link">
        <div className="prod-card-img-wrap">
          <img src={product.image} alt={product.name} className="prod-card-img" />
          <div className="prod-card-badges">
            {product.isBestseller && <span className="prod-badge bestseller">熱銷</span>}
            {product.isNew && <span className="prod-badge new-item">新品</span>}
            {product.isBundle && <span className="prod-badge new-item">組合</span>}
            {discountPct && <span className="prod-badge discount">-{discountPct}%</span>}
          </div>
          <div className="prod-card-hover-overlay">
            <button
              type="button"
              className={`prod-quick-add ${isAdded ? 'added' : ''}`}
              onClick={(event) => {
                event.preventDefault()
                handleAddClick()
              }}
            >
              {isAdded ? <><Check size={16} /> 已加入</> : <><ShoppingCart size={16} /> 加入購物車</>}
            </button>
          </div>
        </div>
      </Link>
      <div className="prod-card-body">
        <div className="prod-meta-row">
          <span className="prod-cat-badge">{catLabel?.label}</span>
          <span className="prod-pet-badge">{petLabel?.label}</span>
        </div>
        <Link to={`/products/${product.slug}`} className="prod-name-link">
          <h3 className="prod-name">{product.name}</h3>
        </Link>
        <p className="prod-specs">{product.specs}</p>
        <p className="prod-usp">{product.usp}</p>
        <div className="prod-rating-row">
          <StarRating rating={product.rating} />
          <span className="prod-review-count">{product.reviewCount}</span>
        </div>
        <div className="prod-price-row">
          <span className="prod-price">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="prod-original-price">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterPanel({
  search,
  setSearch,
  category,
  setCategory,
  petType,
  setPetType,
  priceRange,
  setPriceRange,
  activeFilters,
  clearAllFilters,
  resetPage,
}) {
  return (
    <div className="prod-filter-content">
      <div className="prod-filter-search">
        <Search size={16} className="prod-filter-search-icon" />
        <input
          type="text"
          placeholder="搜尋商品..."
          className="prod-filter-search-input"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            resetPage()
          }}
        />
        {search && (
          <button className="prod-filter-search-clear" onClick={() => { setSearch(''); resetPage() }}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="prod-filter-group">
        <h4 className="prod-filter-group-title">商品分類</h4>
        <div className="prod-filter-cat-list">
          {CATEGORIES.map((item) => (
            <button
              key={item.key}
              className={`prod-filter-cat-btn ${category === item.key ? 'active' : ''}`}
              onClick={() => { setCategory(item.key); resetPage() }}
            >
              <span>{item.label}</span>
              {category === item.key && <Check size={14} className="prod-filter-check" />}
            </button>
          ))}
        </div>
      </div>

      <div className="prod-filter-group">
        <h4 className="prod-filter-group-title">適用毛孩</h4>
        <div className="prod-filter-pet-row">
          {PET_TYPES.map((item) => (
            <button
              key={item.key}
              className={`prod-filter-pet-btn ${petType === item.key ? 'active' : ''}`}
              onClick={() => { setPetType(item.key); resetPage() }}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="prod-filter-group">
        <h4 className="prod-filter-group-title">價格區間</h4>
        <div className="prod-filter-price-list">
          {PRICE_RANGES.map((item) => (
            <label key={item.key} className={`prod-filter-price-item ${priceRange === item.key ? 'active' : ''}`}>
              <input
                type="radio"
                name="priceRange"
                checked={priceRange === item.key}
                onChange={() => { setPriceRange(item.key); resetPage() }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <button className="prod-filter-clear-all" onClick={clearAllFilters}>
          <X size={14} /> 清除全部篩選
        </button>
      )}
    </div>
  )
}

export default function Products() {
  const { addToCart } = useCart()
  const [category, setCategory] = useState('all')
  const [petType, setPetType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [productFilter, setProductFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('grid')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const handleAddToCart = useCallback((product) => {
    addToCart(createCartPayload(product, product.variants[0], 1))
  }, [addToCart])

  const filteredProducts = useMemo(() => {
    const activePriceRange = PRICE_RANGES.find((item) => item.key === priceRange)

    let list = PRODUCT_CATALOG.filter((product) => {
      if (category !== 'all' && product.category !== category) return false
      if (petType !== 'all' && product.petType !== petType) return false
      if (product.price < activePriceRange.min || product.price > activePriceRange.max) return false

      if (search.trim()) {
        const query = search.trim().toLowerCase()
        if (
          !product.name.toLowerCase().includes(query)
          && !product.specs.toLowerCase().includes(query)
          && !product.usp.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      if (productFilter === 'bestseller' && !product.isBestseller) return false
      if (productFilter === 'discount' && !product.originalPrice) return false
      if (productFilter === 'bundle' && !product.isBundle) return false
      if (productFilter === 'new' && !product.isNew) return false

      return true
    })

    switch (sortBy) {
      case 'newest':
        list = list.filter((product) => product.isNew).concat(list.filter((product) => !product.isNew))
        break
      case 'popular':
        list = [...list].sort((left, right) => right.reviewCount - left.reviewCount)
        break
      case 'price-asc':
        list = [...list].sort((left, right) => left.price - right.price)
        break
      case 'price-desc':
        list = [...list].sort((left, right) => right.price - left.price)
        break
      default:
        list = [...list].sort((left, right) => Number(right.isBestseller) - Number(left.isBestseller))
        break
    }

    return list
  }, [category, petType, priceRange, sortBy, search, productFilter])

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE)
  const paginatedList = filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const resetPage = () => setPage(1)

  const activeFilters = useMemo(() => {
    const filters = []

    if (category !== 'all') {
      filters.push({
        key: 'category',
        label: CATEGORIES.find((item) => item.key === category)?.label,
        clear: () => { setCategory('all'); resetPage() },
      })
    }

    if (petType !== 'all') {
      filters.push({
        key: 'petType',
        label: PET_TYPES.find((item) => item.key === petType)?.label,
        clear: () => { setPetType('all'); resetPage() },
      })
    }

    if (priceRange !== 'all') {
      filters.push({
        key: 'priceRange',
        label: PRICE_RANGES.find((item) => item.key === priceRange)?.label,
        clear: () => { setPriceRange('all'); resetPage() },
      })
    }

    if (productFilter !== 'all') {
      filters.push({
        key: 'productFilter',
        label: PRODUCT_FILTERS.find((item) => item.key === productFilter)?.label,
        clear: () => { setProductFilter('all'); resetPage() },
      })
    }

    if (search.trim()) {
      filters.push({
        key: 'search',
        label: `"${search}"`,
        clear: () => { setSearch(''); resetPage() },
      })
    }

    return filters
  }, [category, petType, priceRange, productFilter, search])

  const clearAllFilters = () => {
    setCategory('all')
    setPetType('all')
    setPriceRange('all')
    setProductFilter('all')
    setSearch('')
    resetPage()
  }

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
    if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  return (
    <main className="products-page">
      <div className="checkout-header-simple">
        <h1 className="headline-pro">所有商品</h1>
      </div>

      <div className="products-layout">
        <aside className="products-sidebar">
          <div className="prod-sidebar-card">
            <div className="prod-sidebar-title">
              <SlidersHorizontal size={16} style={{ marginRight: 8 }} />
              篩選條件
            </div>
            <FilterPanel
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              petType={petType}
              setPetType={setPetType}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              activeFilters={activeFilters}
              clearAllFilters={clearAllFilters}
              resetPage={resetPage}
            />
          </div>
        </aside>

        <div className="products-main">
          <div className="prod-toolbar">
            <div className="prod-toolbar-left">
              <button
                className="prod-view-btn"
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-label="開啟篩選"
                title="開啟篩選"
              >
                <SlidersHorizontal size={18} />
              </button>

              <div className="prod-select-wrap">
                <select className="prod-select" value={sortBy} onChange={(event) => { setSortBy(event.target.value); resetPage() }}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="prod-select-arrow" />
              </div>

              <div className="prod-select-wrap">
                <select className="prod-select" value={productFilter} onChange={(event) => { setProductFilter(event.target.value); resetPage() }}>
                  {PRODUCT_FILTERS.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="prod-select-arrow" />
              </div>

              <div className="prod-view-toggle">
                <button className={`prod-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="格狀顯示">
                  <Grid3X3 size={18} />
                </button>
                <button className={`prod-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="列表顯示">
                  <LayoutList size={18} />
                </button>
              </div>
            </div>

            <div className="prod-toolbar-right">
              <span className="prod-result-count">
                共 <strong>{filteredProducts.length}</strong> 項商品
              </span>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="prod-active-filters">
              {activeFilters.map((filter) => (
                <span key={filter.key} className="prod-filter-chip">
                  {filter.label}
                  <button onClick={filter.clear}><X size={12} /></button>
                </span>
              ))}
              <button className="prod-filter-chip-clear" onClick={clearAllFilters}>清除全部</button>
            </div>
          )}

          {paginatedList.length > 0 ? (
            <div className={viewMode === 'grid' ? 'prod-grid' : 'prod-list'}>
              {paginatedList.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="prod-empty">
              <span className="prod-empty-icon">🔎</span>
              <h3>目前沒有符合條件的商品</h3>
              <p>你可以清除篩選或換一個搜尋條件試試看。</p>
              <button className="btn-blue" style={{ padding: '12px 28px', borderRadius: 980, marginTop: 8 }} onClick={clearAllFilters}>
                清除所有篩選
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="prod-pagination">
              <button className="prod-page-btn arrow" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((pageNumber, index) => (
                pageNumber === '...'
                  ? <span key={`dot-${index}`} className="prod-page-dots">⋯</span>
                  : (
                    <button key={pageNumber} className={`prod-page-btn ${page === pageNumber ? 'active' : ''}`} onClick={() => setPage(pageNumber)}>
                      {pageNumber}
                    </button>
                  )
              ))}

              <button className="prod-page-btn arrow" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <div className="prod-filter-drawer-overlay" onClick={() => setFilterOpen(false)}>
          <div className="prod-filter-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="prod-filter-drawer-header">
              <h3>篩選條件</h3>
              <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
            </div>
            <div className="prod-filter-drawer-body">
              <FilterPanel
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                petType={petType}
                setPetType={setPetType}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                activeFilters={activeFilters}
                clearAllFilters={clearAllFilters}
                resetPage={resetPage}
              />
            </div>
            <div className="prod-filter-drawer-footer">
              <button className="btn-blue" style={{ width: '100%', padding: '16px', borderRadius: 12, fontSize: 16 }} onClick={() => setFilterOpen(false)}>
                查看 {filteredProducts.length} 項商品
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
