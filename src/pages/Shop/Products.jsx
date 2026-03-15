import React, { useState, useMemo, useCallback } from 'react';
import {
    SlidersHorizontal, X, ShoppingCart, Star, Grid3X3, LayoutList,
    ChevronDown, Search, Check, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './Products.css'

// ─────────────────────────────────────────────
// 常數定義
// ─────────────────────────────────────────────
const CATEGORIES = [
    { key: 'all', label: '全部商品' },
    { key: 'food', label: '主食糧' },
    { key: 'snacks', label: '零食點心' },
    { key: 'health', label: '保健品' },
    { key: 'supplies', label: '生活用品' },
];

const PET_TYPES = [
    { key: 'all', label: '全部' },
    { key: 'cat', label: '貓咪' },
    { key: 'dog', label: '狗狗' },
];

const PRICE_RANGES = [
    { key: 'all', label: '全部價格', min: 0, max: Infinity },
    { key: 'under500', label: 'NT$500 以下', min: 0, max: 499 },
    { key: '500-1000', label: 'NT$500–1,000', min: 500, max: 1000 },
    { key: '1000-2000', label: 'NT$1,000–2,000', min: 1001, max: 2000 },
    { key: 'over2000', label: 'NT$2,000 以上', min: 2001, max: Infinity },
];

const SORT_OPTIONS = [
    { key: 'default', label: '預設排序' },
    { key: 'newest', label: '最新上架' },
    { key: 'popular', label: '熱門商品' },
    { key: 'price-asc', label: '價格：低至高' },
    { key: 'price-desc', label: '價格：高至低' },
];

const PER_PAGE_OPTIONS = [8, 16, 24];

// ─────────────────────────────────────────────
// Mock 商品資料（維持原樣）
// ─────────────────────────────────────────────
const IMGS = {
    cat1: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=400',
    cat2: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&q=80&w=400',
    cat3: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&q=80&w=400',
    dog1: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=400',
    dog2: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400',
    dog3: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400',
    sup1: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=400',
    sup2: 'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?auto=format&fit=crop&q=80&w=400',
};

const MOCK_PRODUCTS = [
    { id: 1, name: 'Polar 頂級鮭魚主食糧', category: 'food', petType: 'cat', price: 890, originalPrice: null, specs: '成貓配方 / 1.5kg', rating: 4.9, reviewCount: 236, isBestseller: true, isNew: false, image: IMGS.cat1 },
    { id: 2, name: 'Polar 凍乾雞肉主食糧', category: 'food', petType: 'cat', price: 1280, originalPrice: 1580, specs: '全齡貓配方 / 1.2kg', rating: 4.7, reviewCount: 118, isBestseller: false, isNew: true, image: IMGS.cat2 },
    { id: 3, name: 'Polar 深海鮪魚主食糧', category: 'food', petType: 'cat', price: 750, originalPrice: null, specs: '幼貓配方 / 1.0kg', rating: 4.6, reviewCount: 89, isBestseller: false, isNew: false, image: IMGS.cat3 },
    { id: 4, name: 'Polar 農場羊肉主食糧', category: 'food', petType: 'dog', price: 1050, originalPrice: null, specs: '成犬配方 / 2.0kg', rating: 4.8, reviewCount: 163, isBestseller: true, isNew: false, image: IMGS.dog1 },
    { id: 5, name: 'Polar 草飼牛肉主食糧', category: 'food', petType: 'dog', price: 1380, originalPrice: 1680, specs: '大型犬配方 / 3.0kg', rating: 4.9, reviewCount: 201, isBestseller: true, isNew: false, image: IMGS.dog2 },
    { id: 6, name: 'Polar 幼犬啟蒙主食糧', category: 'food', petType: 'dog', price: 920, originalPrice: null, specs: '幼犬配方 / 1.5kg', rating: 4.5, reviewCount: 72, isBestseller: false, isNew: true, image: IMGS.dog3 },
    { id: 7, name: 'Polar 凍乾鮭魚零食', category: 'snacks', petType: 'cat', price: 360, originalPrice: null, specs: '貓咪專用 / 50g', rating: 4.9, reviewCount: 312, isBestseller: true, isNew: false, image: IMGS.cat3 },
    { id: 8, name: 'Polar 雞肉潔牙骨', category: 'snacks', petType: 'dog', price: 480, originalPrice: 580, specs: '中小型犬 / 10入', rating: 4.7, reviewCount: 187, isBestseller: false, isNew: false, image: IMGS.dog1 },
    { id: 9, name: 'Polar 貓咪肉泥條', category: 'snacks', petType: 'cat', price: 290, originalPrice: null, specs: '綜合口味 / 12入', rating: 4.8, reviewCount: 256, isBestseller: true, isNew: false, image: IMGS.cat1 },
    { id: 10, name: 'Polar 犬用起司餅乾', category: 'snacks', petType: 'dog', price: 320, originalPrice: null, specs: '全齡犬 / 200g', rating: 4.6, reviewCount: 94, isBestseller: false, isNew: true, image: IMGS.dog2 },
    { id: 11, name: 'Polar 貓咪鮪魚慕斯', category: 'snacks', petType: 'cat', price: 420, originalPrice: 520, specs: '成貓 / 80g × 6', rating: 4.7, reviewCount: 143, isBestseller: false, isNew: false, image: IMGS.cat2 },
    { id: 12, name: 'Polar 犬用肉乾禮盒', category: 'snacks', petType: 'dog', price: 780, originalPrice: 980, specs: '全口味 / 禮盒裝', rating: 4.9, reviewCount: 67, isBestseller: false, isNew: true, image: IMGS.dog3 },
    { id: 13, name: 'Polar Joint 關節保健', category: 'health', petType: 'dog', price: 1290, originalPrice: null, specs: '大型犬 / 60顆', rating: 4.9, reviewCount: 198, isBestseller: true, isNew: false, image: IMGS.sup1 },
    { id: 14, name: 'Polar 深海魚油膠囊', category: 'health', petType: 'cat', price: 480, originalPrice: null, specs: '全齡貓 / 90顆', rating: 4.8, reviewCount: 142, isBestseller: false, isNew: false, image: IMGS.sup2 },
    { id: 15, name: 'Polar 益生菌腸保健', category: 'health', petType: 'cat', price: 990, originalPrice: 1180, specs: '成貓配方 / 30包', rating: 4.7, reviewCount: 86, isBestseller: false, isNew: false, image: IMGS.cat3 },
    { id: 16, name: 'Polar 毛髮光澤保健品', category: 'health', petType: 'dog', price: 860, originalPrice: null, specs: '成犬 / 60錠', rating: 4.6, reviewCount: 73, isBestseller: false, isNew: true, image: IMGS.dog1 },
    { id: 17, name: 'Polar 犬用口腔保健', category: 'health', petType: 'dog', price: 650, originalPrice: null, specs: '全齡犬 / 噴劑 100ml', rating: 4.5, reviewCount: 55, isBestseller: false, isNew: false, image: IMGS.dog2 },
    { id: 18, name: 'Polar 貓咪泌尿保健', category: 'health', petType: 'cat', price: 1150, originalPrice: 1380, specs: '成貓 / 粉末劑 90g', rating: 4.8, reviewCount: 112, isBestseller: true, isNew: false, image: IMGS.sup1 },
    { id: 19, name: 'Polar 陶瓷自動飲水機', category: 'supplies', petType: 'cat', price: 1680, originalPrice: null, specs: '2.5L / 靜音設計', rating: 4.9, reviewCount: 224, isBestseller: true, isNew: false, image: IMGS.sup2 },
    { id: 20, name: 'Polar 不鏽鋼慢食碗', category: 'supplies', petType: 'dog', price: 520, originalPrice: 680, specs: 'L 號 / 霧面黑', rating: 4.7, reviewCount: 98, isBestseller: false, isNew: false, image: IMGS.dog3 },
    { id: 21, name: 'Polar 貓咪麻繩抓板', category: 'supplies', petType: 'cat', price: 890, originalPrice: null, specs: '麻繩材質 / 三件組', rating: 4.6, reviewCount: 77, isBestseller: false, isNew: true, image: IMGS.cat1 },
    { id: 22, name: 'Polar 航空規格提籠', category: 'supplies', petType: 'cat', price: 2200, originalPrice: 2800, specs: '航空規格 / 酒紅色', rating: 4.8, reviewCount: 163, isBestseller: true, isNew: false, image: IMGS.sup1 },
    { id: 23, name: 'Polar 皮革犬用牽繩', category: 'supplies', petType: 'dog', price: 740, originalPrice: null, specs: '皮革材質 / 深棕色', rating: 4.7, reviewCount: 89, isBestseller: false, isNew: false, image: IMGS.dog1 },
    { id: 24, name: 'Polar 寵物清潔濕紙巾', category: 'supplies', petType: 'cat', price: 280, originalPrice: null, specs: '貓犬通用 / 80抽', rating: 4.5, reviewCount: 45, isBestseller: false, isNew: true, image: IMGS.cat2 },
];

// ─────────────────────────────────────────────
// 工具元件
// ─────────────────────────────────────────────
const formatPrice = (p) => `NT$${Number(p).toLocaleString()}`;

function StarRating({ rating }) {
    return (
        <div className="prod-stars">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={13}
                    className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'}
                />
            ))}
            <span className="prod-rating-num">{rating.toFixed(1)}</span>
        </div>
    );
}

// ─────────────────────────────────────────────
// ProductCard (獨立管理「已加入」狀態)
// ─────────────────────────────────────────────

function ProductCard({ product, viewMode, onAddToCart }) {
    // 讓每張卡片自己管理狀態，避免互相干擾
    const [isAdded, setIsAdded] = useState(false);

    const handleAddClick = () => {
        onAddToCart(product);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1800);
    };

    const discountPct = product.originalPrice
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : null;
    const catLabel = CATEGORIES.find((c) => c.key === product.category);
    const petLabel = PET_TYPES.find((p) => p.key === product.petType);

    if (viewMode === 'list') {
        return (
            <div className="prod-card-list">
                <div className="prod-card-list-img-wrap">
                    <img src={product.image} alt={product.name} className="prod-card-list-img" />
                    {discountPct && <span className="prod-badge discount">-{discountPct}%</span>}
                </div>
                <div className="prod-card-list-body">
                    <div className="prod-card-list-top">
                        <div className="prod-meta-row">
                            <span className="prod-cat-badge">{catLabel?.label}</span>
                            <span className="prod-pet-badge">{petLabel?.label}</span>
                            {product.isBestseller && <span className="prod-badge bestseller">熱銷</span>}
                            {product.isNew && <span className="prod-badge new-item">新品</span>}
                        </div>
                        <h3 className="prod-name">{product.name}</h3>
                        <p className="prod-specs">{product.specs}</p>
                        <StarRating rating={product.rating} />
                        <span className="prod-review-count">（{product.reviewCount} 則評價）</span>
                    </div>
                    <div className="prod-card-list-bottom">
                        <div className="prod-price-block">
                            <span className="prod-price">{formatPrice(product.price)}</span>
                            {product.originalPrice && (
                                <span className="prod-original-price">{formatPrice(product.originalPrice)}</span>
                            )}
                        </div>
                        <button
                            className={`btn-blue prod-add-btn ${isAdded ? 'added' : ''}`}
                            onClick={handleAddClick}
                        >
                            {isAdded ? <><Check size={16} /> 已加入</> : <><ShoppingCart size={16} /> 加入購物車</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="prod-card">
            <div className="prod-card-img-wrap">
                <img src={product.image} alt={product.name} className="prod-card-img" />
                <div className="prod-card-badges">
                    {product.isBestseller && <span className="prod-badge bestseller">熱銷</span>}
                    {product.isNew && <span className="prod-badge new-item">新品</span>}
                    {discountPct && <span className="prod-badge discount">-{discountPct}%</span>}
                </div>
                <div className="prod-card-hover-overlay">
                    <button
                        className={`prod-quick-add ${isAdded ? 'added' : ''}`}
                        onClick={handleAddClick}
                    >
                        {isAdded ? <><Check size={16} /> 已加入</> : <><ShoppingCart size={16} /> 加入購物車</>}
                    </button>
                </div>
            </div>
            <div className="prod-card-body">
                <div className="prod-meta-row">
                    <span className="prod-cat-badge">{catLabel?.label}</span>
                    <span className="prod-pet-badge">{petLabel?.label}</span>
                </div>
                <h3 className="prod-name">{product.name}</h3>
                <p className="prod-specs">{product.specs}</p>
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
    );
}

// ─────────────────────────────────────────────
// FilterPanel (獨立出來的篩選區塊元件)
// ─────────────────────────────────────────────
function FilterPanel({
    search, setSearch, category, setCategory, petType, setPetType,
    priceRange, setPriceRange, activeFilters, clearAllFilters, resetPage
}) {
    return (
        <div className="prod-filter-content">
            {/* 搜尋 */}
            <div className="prod-filter-search">
                <Search size={16} className="prod-filter-search-icon" />
                <input
                    type="text"
                    placeholder="搜尋商品..."
                    className="prod-filter-search-input"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                />
                {search && (
                    <button className="prod-filter-search-clear" onClick={() => { setSearch(''); resetPage(); }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* 分類 */}
            <div className="prod-filter-group">
                <h4 className="prod-filter-group-title">商品分類</h4>
                <div className="prod-filter-cat-list">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.key}
                            className={`prod-filter-cat-btn ${category === c.key ? 'active' : ''}`}
                            onClick={() => { setCategory(c.key); resetPage(); }}
                        >
                            <span>{c.label}</span>
                            {category === c.key && <Check size={14} className="prod-filter-check" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* 寵物類型 */}
            <div className="prod-filter-group">
                <h4 className="prod-filter-group-title">寵物類型</h4>
                <div className="prod-filter-pet-row">
                    {PET_TYPES.map((p) => (
                        <button
                            key={p.key}
                            className={`prod-filter-pet-btn ${petType === p.key ? 'active' : ''}`}
                            onClick={() => { setPetType(p.key); resetPage(); }}
                        >
                            <span>{p.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 價格區間 */}
            <div className="prod-filter-group">
                <h4 className="prod-filter-group-title">價格區間</h4>
                <div className="prod-filter-price-list">
                    {PRICE_RANGES.map((r) => (
                        <label key={r.key} className={`prod-filter-price-item ${priceRange === r.key ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="priceRange"
                                checked={priceRange === r.key}
                                onChange={() => { setPriceRange(r.key); resetPage(); }}
                            />
                            {r.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* 清除所有篩選 */}
            {activeFilters.length > 0 && (
                <button className="prod-filter-clear-all" onClick={clearAllFilters}>
                    <X size={14} /> 清除所有篩選
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// 主頁面 Products
// ─────────────────────────────────────────────
export default function Products() {
    const { addToCart } = useCart();

    // ── Filter & Display State ──
    const [category, setCategory] = useState('all');
    const [petType, setPetType] = useState('all');
    const [priceRange, setPriceRange] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [perPage, setPerPage] = useState(16);
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);

    // ── Handle Add to Cart ──
    const handleAddToCart = useCallback((product) => {
        addToCart({
            id: product.id,
            name: product.name,
            image: product.image,
            specs: product.specs,
            price: product.price,
            quantity: 1,
            shippingMethods: ['宅配', '超商取貨'],
        });
    }, [addToCart]);

    // ── Filtered & Sorted Products ──
    const filteredProducts = useMemo(() => {
        const pr = PRICE_RANGES.find((r) => r.key === priceRange);

        let list = MOCK_PRODUCTS.filter((p) => {
            if (category !== 'all' && p.category !== category) return false;
            if (petType !== 'all' && p.petType !== petType) return false;
            if (p.price < pr.min || p.price > pr.max) return false;
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                if (!p.name.toLowerCase().includes(q) && !p.specs.toLowerCase().includes(q)) return false;
            }
            return true;
        });

        switch (sortBy) {
            case 'newest': list = list.filter((p) => p.isNew).concat(list.filter((p) => !p.isNew)); break;
            case 'popular': list = [...list].sort((a, b) => b.reviewCount - a.reviewCount); break;
            case 'price-asc': list = [...list].sort((a, b) => a.price - b.price); break;
            case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break;
            default: list = [...list].sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0)); break;
        }
        return list;
    }, [category, petType, priceRange, sortBy, search]);

    const totalPages = Math.ceil(filteredProducts.length / perPage);
    const paginatedList = filteredProducts.slice((page - 1) * perPage, page * perPage);

    const resetPage = () => setPage(1);

    // ── Active Filters ──
    const activeFilters = useMemo(() => {
        const f = [];
        if (category !== 'all') f.push({ key: 'category', label: CATEGORIES.find((c) => c.key === category)?.label, clear: () => { setCategory('all'); resetPage(); } });
        if (petType !== 'all') f.push({ key: 'petType', label: PET_TYPES.find((p) => p.key === petType)?.label, clear: () => { setPetType('all'); resetPage(); } });
        if (priceRange !== 'all') f.push({ key: 'priceRange', label: PRICE_RANGES.find((r) => r.key === priceRange)?.label, clear: () => { setPriceRange('all'); resetPage(); } });
        if (search.trim()) f.push({ key: 'search', label: `"${search}"`, clear: () => { setSearch(''); resetPage(); } });
        return f;
    }, [category, petType, priceRange, search]);

    const clearAllFilters = () => {
        setCategory('all'); setPetType('all'); setPriceRange('all'); setSearch(''); resetPage();
    };

    // ── Pagination helper ──
    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', page - 1, page, page + 1, '...', totalPages];
    };

    return (
        <main className="products-page">
            <div className="checkout-header-simple">
                <h1 className="headline-pro">全部商品</h1>
            </div>
            <div className="products-layout">
                {/* ── 桌面 Sidebar ── */}


                {/* ── 主內容 ── */}
                <div className="products-main">
                    {/* ── Toolbar ── */}
                    <div className="prod-toolbar">
                        <div className="prod-toolbar-left">
                            <div className="prod-select-wrap">
                                <select className="prod-select" value={sortBy} onChange={(e) => { setSortBy(e.target.value); resetPage(); }}>
                                    {SORT_OPTIONS.map((o) => (
                                        <option key={o.key} value={o.key}>{o.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="prod-select-arrow" />
                            </div>

                            <div className="prod-select-wrap">
                                <select className="prod-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); resetPage(); }}>
                                    {PER_PAGE_OPTIONS.map((n) => (
                                        <option key={n} value={n}>每頁 {n} 件</option>
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
                                共 <strong>{filteredProducts.length}</strong> 件商品
                            </span>
                        </div>
                    </div>

                    {/* ── 已套用篩選標籤 ── */}
                    {activeFilters.length > 0 && (
                        <div className="prod-active-filters">
                            {activeFilters.map((f) => (
                                <span key={f.key} className="prod-filter-chip">
                                    {f.label}
                                    <button onClick={f.clear}><X size={12} /></button>
                                </span>
                            ))}
                            <button className="prod-filter-chip-clear" onClick={clearAllFilters}>清除全部</button>
                        </div>
                    )}

                    {/* ── 商品列表 ── */}
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
                            <span className="prod-empty-icon">🔍</span>
                            <h3>找不到符合條件的商品</h3>
                            <p>請嘗試調整篩選條件</p>
                            <button className="btn-blue" style={{ padding: '12px 28px', borderRadius: 980, marginTop: 8 }} onClick={clearAllFilters}>
                                清除所有篩選
                            </button>
                        </div>
                    )}

                    {/* ── 分頁 ── */}
                    {totalPages > 1 && (
                        <div className="prod-pagination">
                            <button className="prod-page-btn arrow" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                <ChevronLeft size={18} />
                            </button>

                            {getPageNumbers().map((p, i) =>
                                p === '...'
                                    ? <span key={`dot-${i}`} className="prod-page-dots">···</span>
                                    : (
                                        <button key={p} className={`prod-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                                            {p}
                                        </button>
                                    )
                            )}

                            <button className="prod-page-btn arrow" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 行動版篩選抽屜 ── */}
            {filterOpen && (
                <div className="prod-filter-drawer-overlay" onClick={() => setFilterOpen(false)}>
                    <div className="prod-filter-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="prod-filter-drawer-header">
                            <h3>篩選條件</h3>
                            <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="prod-filter-drawer-body">
                            <FilterPanel
                                search={search} setSearch={setSearch}
                                category={category} setCategory={setCategory}
                                petType={petType} setPetType={setPetType}
                                priceRange={priceRange} setPriceRange={setPriceRange}
                                activeFilters={activeFilters} clearAllFilters={clearAllFilters}
                                resetPage={resetPage}
                            />
                        </div>
                        <div className="prod-filter-drawer-footer">
                            <button className="btn-blue" style={{ width: '100%', padding: '16px', borderRadius: 12, fontSize: 16 }} onClick={() => setFilterOpen(false)}>
                                查看 {filteredProducts.length} 件商品
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}