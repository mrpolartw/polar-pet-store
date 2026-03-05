import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';

// --- Styles & Assets ---
import './App.css';
import LogoImg from './png/LOGO去背景.png';

// --- Pages & Components ---
import Home from './pages/Home';
import About from './pages/About';
import Category from './pages/Category';
import CustomCursor from './components/CustomCursor';

// ==========================================
// Helper: 切換路由時，自動將畫面捲軸移至最上方
// ==========================================
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// ==========================================
// Main Content Component
// ==========================================
function AppContent() {
  const location = useLocation();

  // ----------------------------------------
  // 1. 狀態管理 (States)
  // ----------------------------------------
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuDepth, setMobileMenuDepth] = useState('main'); // 手機版選單層級
  const [isCartOpen, setIsCartOpen] = useState(false); // 購物袋彈窗狀態

  // ----------------------------------------
  // 2. 衍生變數 (Derived Variables)
  // ----------------------------------------
  const isHomePage = location.pathname === '/' || location.pathname === '';
  const navbarClass = `navbar-apple ${(!isHomePage || scrolled) ? 'scrolled' : ''}`;

  // ----------------------------------------
  // 3. 生命週期與監聽 (Effects)
  // ----------------------------------------
  // 監聽滾動事件以改變導覽列樣式
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, location.pathname]);

  // 當路由改變時，自動關閉所有選單與彈窗
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
    setIsCartOpen(false);
    setTimeout(() => setMobileMenuDepth('main'), 300);
  }, [location.pathname]);

  // ----------------------------------------
  // 4. 事件處理函數 (Handlers)
  // ----------------------------------------
  // 切換手機版漢堡選單
  const toggleMenu = () => {
    if (isMenuOpen) {
      // 關閉時，延遲一下再把層級重置回 main，避免關閉動畫中途閃爍
      setTimeout(() => setMobileMenuDepth('main'), 300);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  // 當滑鼠進入導覽列特定選單時
  const handleMouseEnterDropdown = (type) => {
    setActiveDropdown(type);
    setIsCartOpen(false); // 避免購物袋與其他下拉選單重疊
  };


  // ----------------------------------------
  // 5. 畫面渲染 (Render)
  // ----------------------------------------
  return (
    <div className="app-container">
      <CustomCursor />
      <ScrollToTop />

      {/* ==================== 導覽列區塊 ==================== */}
      <div className="navbar-wrapper" onMouseLeave={() => setActiveDropdown(null)}>
        <nav className={navbarClass}>
          <div className="navbar-container">
            
            {/* 左側 Logo */}
            <div className="nav-logo">
              <Link to="/" onClick={() => setActiveDropdown(null)}>
                <img src={LogoImg} alt="Polar Logo" />
              </Link>
            </div>

            {/* 中間 桌機版文字選單 */}
            <div className="nav-desktop-links">
              <Link to="/products" onMouseEnter={() => handleMouseEnterDropdown(null)}>商品列表</Link>
              <Link to="/joints" onMouseEnter={() => handleMouseEnterDropdown(null)}>關節保健</Link>
              <Link to="/about" onMouseEnter={() => handleMouseEnterDropdown(null)}>品牌介紹</Link>

              {/* 需要下拉選單的項目：服務支援 */}
              <div
                className={`nav-item-dropdown ${activeDropdown === 'support' ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnterDropdown('support')}
              >
                <Link to="/support" onClick={(e) => e.preventDefault()}>服務支援</Link>
              </div>

              <Link to="/contact" onMouseEnter={() => handleMouseEnterDropdown(null)}>聯絡我們</Link>
            </div>

            {/* 右側 功能按鈕區 */}
            <div className="nav-actions">
              
              <button
                className="icon-btn"
                aria-label="搜尋"
                onMouseEnter={() => handleMouseEnterDropdown(null)}
              >
                <Search size={18} />
              </button>

              {/* 購物袋容器 */}
              <div className="cart-item-wrapper" style={{ position: 'relative' }}>
                <button
                  className={`icon-btn ${isCartOpen ? 'active' : ''}`}
                  aria-label="購物袋"
                  onClick={() => {
                    setIsCartOpen(!isCartOpen);
                    setActiveDropdown(null);
                  }}
                  onMouseEnter={() => handleMouseEnterDropdown(null)}
                >
                  <ShoppingBag size={18} />
                </button>

                {/* 購物袋彈窗 */}
                {isCartOpen && (
                  <div className="cart-dropdown-overlay">
                    <div className="cart-dropdown-content">
                      <p className="cart-status-text">購物袋是空的。</p>
                      <div className="cart-divider"></div>
                      <ul className="cart-menu-links">
                        <li><Link to="/orders" onClick={() => setIsCartOpen(false)}>訂單</Link></li>
                        <li><Link to="/favorites" onClick={() => setIsCartOpen(false)}>你的收藏</Link></li>
                        <li><Link to="/account" onClick={() => setIsCartOpen(false)}>帳號</Link></li>
                        <li><Link to="/login" onClick={() => setIsCartOpen(false)}>登入</Link></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* 手機版漢堡按鈕 */}
              <button className="hamburger-btn" onClick={toggleMenu} aria-label="選單">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* 桌機版：大型下拉選單 (Mega Menu) */}
        <div className={`mega-menu ${activeDropdown ? 'show' : ''}`}>
          <div className="mega-menu-content">
            {activeDropdown === 'support' && (
              <>
                <div className="mega-menu-column">
                  <h4>線上服務</h4>
                  <Link to="/blog" onClick={() => setActiveDropdown(null)}>部落格專欄</Link>
                  <a href="https://line.me/tw/" target="_blank" rel="noreferrer" onClick={() => setActiveDropdown(null)}>LINE 官方客戶服務</a>
                </div>
                <div className="mega-menu-column">
                  <h4>售後支援</h4>
                  <Link to="/order" onClick={() => setActiveDropdown(null)}>訂單查詢</Link>
                  <Link to="/faq" onClick={() => setActiveDropdown(null)}>常見問題 (FAQ)</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== 手機版選單區塊 ==================== */}
      <div className={`nav-overlay ${isMenuOpen ? 'open' : ''}`}>
        <div
          className="nav-overlay-slider"
          style={{ transform: mobileMenuDepth === 'main' ? 'translateX(0)' : 'translateX(-50%)' }}
        >
          {/* 第 1 層面板：主選單 */}
          <div className="nav-overlay-panel">
            <ul className="nav-links-mobile">
              <li><Link to="/products" onClick={toggleMenu}>商品列表</Link></li>
              <li><Link to="/joints" onClick={toggleMenu}>關節保健</Link></li>
              <li><Link to="/about" onClick={toggleMenu}>品牌介紹</Link></li>
              <li>
                <button
                  className="nav-mobile-next-btn"
                  onClick={() => setMobileMenuDepth('support')}
                >
                  服務支援 <span className="arrow">〉</span>
                </button>
              </li>
              <li><Link to="/contact" onClick={toggleMenu}>聯絡我們</Link></li>
            </ul>
          </div>

          {/* 第 2 層面板：服務支援次選單 */}
          <div className="nav-overlay-panel">
            <button
              className="nav-mobile-back-btn"
              onClick={() => setMobileMenuDepth('main')}
            >
              <span className="arrow">〈</span> 服務支援
            </button>
            <ul className="nav-links-mobile sub-links">
              <li className="mobile-sub-title">線上服務</li>
              <li><Link to="/blog" onClick={toggleMenu}>部落格專欄</Link></li>
              <li><a href="https://line.me/tw/" target="_blank" rel="noreferrer" onClick={toggleMenu}>LINE 官方客戶服務</a></li>
              <li className="mobile-sub-title" style={{ marginTop: '24px' }}>售後支援</li>
              <li><Link to="/order" onClick={toggleMenu}>訂單查詢</Link></li>
              <li><Link to="/faq" onClick={toggleMenu}>常見問題 (FAQ)</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ==================== 頁面路由區塊 ==================== */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/main-food" element={<Category title="主食系列" subtitle="滿足獵食天性的極致營養" />} />
        <Route path="/snacks" element={<Category title="原肉手工點心" subtitle="純粹無添加的週末幸福獎勵" />} />
        <Route path="/health" element={<Category title="極致保健" subtitle="保護牠清澈無瑕的雙眼與活力" />} />
        <Route path="*" element={<Home />} />
      </Routes>

      {/* ==================== 頁尾區塊 ==================== */}
      <footer className="footer-global">
        <div className="footer-content">
          <p className="footer-mini-text">*</p>
          <div className="footer-divider"></div>
          <div className="footer-nav">
            <div className="footer-column">
              <h4>選購與了解</h4>
              <ul>
                <li><Link to="/about">認識品牌</Link></li>
                <li><Link to="/">Polar Pro</Link></li>
                <li><Link to="/">Polar 鮮糧</Link></li>
                <li><Link to="/">點心與零食</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>服務</h4>
              <ul>
                <li><Link to="/">定期定額配送</Link></li>
                <li><Link to="/">全額退款保證</Link></li>
                <li><Link to="/">會員點數回饋</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>關於 Polar</h4>
              <ul>
                <li><Link to="/about">品牌故事</Link></li>
                <li><Link to="/">獸醫團隊</Link></li>
                <li><Link to="/">社會責任</Link></li>
                <li><Link to="/">就業機會</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>Copyright © 2026 Mr.Polar Inc. 保留一切權利。</p>
            <div className="footer-legal">
              <Link to="/">隱私權政策</Link> | <Link to="/">使用條款</Link> | <Link to="/">銷售及退款</Link> | <Link to="/">網站地圖</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// App Entry
// ==========================================
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;