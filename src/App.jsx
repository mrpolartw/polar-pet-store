import React, { Suspense, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, LogOut } from 'lucide-react';

// --- Context ---
import { useAuth } from './context/useAuth';
import { useCart } from './context/useCart';

// --- Styles & Assets ---
import './App.css';
import LogoImg from './png/LOGO去背景.png';

// --- Shop Pages ---
// 訂單查詢頁面

// --- Auth Pages ---

// --- Account Pages ---

// --- Other Pages & Components ---
import { ProtectedRoute, PublicRoute } from './guards';
import { ROUTES } from './constants/routes';
import { CONFIG } from './constants/config'
import { PageLoader, ConsentBanner } from './components/common';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary'
import CustomCursor from './components/CustomCursor';
import analytics from './utils/analytics'
import { storage } from './utils/storage'

const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Category = React.lazy(() => import('./pages/Category'));
const Blog       = React.lazy(() => import('./pages/Blog/Blog'))
const BlogDetail = React.lazy(() => import('./pages/Blog/BlogDetail'))
const Contact = React.lazy(() => import('./pages/Contact'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy'));
const MemberBenefits = React.lazy(() => import('./pages/MemberBenefits/MemberBenefits'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService/TermsOfService'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));

const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/Auth/ForgotPassword'));
const ServerError   = React.lazy(() => import('./pages/Error/ServerError'))
const ResetPassword = React.lazy(() => import('./pages/ResetPassword/ResetPassword'))
const Founder          = React.lazy(() => import('./pages/Brand/Founder'))
const QualityAssurance = React.lazy(() => import('./pages/Brand/QualityAssurance'))

const Account = React.lazy(() => import('./pages/Account/Account'));

const Products = React.lazy(() => import('./pages/Shop/Products'));
const ProductDetail = React.lazy(() => import('./pages/Shop/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Shop/Cart'));
const Checkout = React.lazy(() => import('./pages/Shop/Checkout'));
const OrderConfirm = React.lazy(() => import('./pages/Shop/OrderConfirm'));
const OrderQuery = React.lazy(() => import('./pages/Shop/OrderQuery'));
const ProductRegister = React.lazy(() => import('./pages/Shop/ProductRegister'));


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
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const { itemCount, cartItems } = useCart();

  // ----------------------------------------
  // 1. 狀態管理 (States)
  // ----------------------------------------
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuDepth, setMobileMenuDepth] = useState('main');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const scrollYRef = useRef(0);

  // ----------------------------------------
  // 2. 衍生變數 (Derived Variables)
  // ----------------------------------------
  const isMinimalLayout =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/contact';

  const isHomePage =
    location.pathname === '/' ||
    location.pathname === '/polar-pet-store/' ||
    location.pathname === '/polar-pet-store';

  // 判斷是否為精確指標裝置（滑鼠），觸控裝置返回 false
  const isPointerFine = typeof window !== 'undefined'
    && window.matchMedia('(pointer: fine)').matches;

  const navbarClass = `navbar-apple ${(!isHomePage || scrolled) ? 'scrolled' : ''}`;

  const getInitials = (name) => (name ? name.slice(0, 1).toUpperCase() : 'P');
  
  // ----------------------------------------
  // 3. 生命週期與監聽 (Effects)
  // ----------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, location.pathname]);

  useEffect(() => {
    const resetTimer = setTimeout(() => {
      const shouldRestoreScroll = document.body.classList.contains('menu-open');
      setIsMenuOpen(false);
      setActiveDropdown(null);
      setIsCartOpen(false);
      setIsUserMenuOpen(false);
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      if (shouldRestoreScroll) {
        window.scrollTo(0, scrollYRef.current);
      }
      setTimeout(() => setMobileMenuDepth('main'), 420);
    }, 0);

    return () => clearTimeout(resetTimer);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest('.cart-item-wrapper') &&
        !e.target.closest('.user-menu-wrapper')
      ) {
        setIsCartOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    analytics.pageView(location.pathname, document.title)
  }, [location.pathname]);

  // ----------------------------------------
  // 4. 事件處理函數 (Handlers)
  // ----------------------------------------
  const toggleMenu = () => {
    const willOpen = !isMenuOpen;

    if (!willOpen) {
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollYRef.current);
      setTimeout(() => setMobileMenuDepth('main'), 420);
    } else {
      scrollYRef.current = window.scrollY;
      document.body.classList.add('menu-open');
      document.body.style.top = `-${window.scrollY}px`;
    }

    setIsMenuOpen(willOpen);
  };

  const handleMouseEnterDropdown = (type) => {
    setActiveDropdown(type);
    setIsCartOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  // Auth 頁面：全螢幕，不顯示 Navbar 與 Footer
  if (isMinimalLayout) {
    return (
      <ErrorBoundary>
        <div className="app-container" style={{ paddingTop: 0 }}>
          {isPointerFine && <CustomCursor />}
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={ROUTES.LOGIN} element={<PublicRoute><Login /></PublicRoute>} />
              <Route path={ROUTES.REGISTER} element={<PublicRoute><Register /></PublicRoute>} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    );
  }

  // ----------------------------------------
  // 5. 畫面渲染 (Render)
  // ----------------------------------------
  return (
    <ErrorBoundary>
      <div className="app-container">
        {isPointerFine && <CustomCursor />}
        <ScrollToTop />

      {/* ==================== 導覽列區塊 ==================== */}
      <div className="navbar-wrapper" onMouseLeave={() => setActiveDropdown(null)}>
        <nav className={navbarClass}>
          <div className="navbar-container">

            {/* 左側 Logo */}
            <div className="nav-logo">
              <Link to="/" onClick={() => setActiveDropdown(null)}>
                <img src={LogoImg} alt="Mr.Polar 北極先生" />
              </Link>
            </div>

            {/* 中間：桌機版文字選單 */}
            <div className="nav-desktop-links">
              <Link to="/products" onMouseEnter={() => handleMouseEnterDropdown(null)}>商品列表</Link>
              <Link to="/joints" onMouseEnter={() => handleMouseEnterDropdown(null)}>關節保健</Link>
              <div
                className={`nav-item-dropdown ${activeDropdown === 'brand' ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnterDropdown('brand')}
              >
                <Link to="/about" onClick={(e) => e.preventDefault()}>品牌介紹</Link>
              </div>
              <div
                className={`nav-item-dropdown ${activeDropdown === 'support' ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnterDropdown('support')}
              >
                <Link to="/support" onClick={(e) => e.preventDefault()}>服務支援</Link>
              </div>
              <div
                className={`nav-item-dropdown ${activeDropdown === 'contact' ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnterDropdown('contact')}
              >
                <Link to="/contact" onClick={(e) => e.preventDefault()}>聯絡我們</Link>
              </div>
            </div>

            {/* 右側：功能按鈕區 */}
            <div className="nav-actions">

              {/* 搜尋按鈕 */}
              <button
                className="icon-btn"
                aria-label="搜尋"
                title="找毛孩要的..."
                onMouseEnter={() => handleMouseEnterDropdown(null)}
              >
                <Search size={18} />
              </button>

              {/* ── 購物袋按鈕 ── */}
              <div className="cart-item-wrapper" style={{ position: 'relative' }}>
                <button
                  className={`icon-btn cart-icon-btn ${isCartOpen ? 'active' : ''}`}
                  aria-label={`購物袋，共 ${itemCount} 件`}
                  style={{ position: 'relative' }}
                  onClick={() => {
                    setIsCartOpen(!isCartOpen);
                    setIsUserMenuOpen(false);
                    setActiveDropdown(null);
                  }}
                  onMouseEnter={() => handleMouseEnterDropdown(null)}
                >
                  <ShoppingBag size={20} strokeWidth={1.8} />
                  {itemCount > 0 && (
                    <span className="cart-badge">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </button>

                {/* ── 購物袋彈窗（Apple 官網風格）── */}
                {isCartOpen && (
                  <div className="cart-dropdown-overlay cart-preview-overlay" style={{ width: 320 }}>
                    <div className="cart-dropdown-content" style={{ padding: '20px 20px 16px' }}>

                      {/* Header：標題 + 檢視按鈕 */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: cartItems && cartItems.length > 0 ? 6 : 16,
                      }}>
                        <span style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--color-text-dark)',
                          letterSpacing: '-0.01em',
                        }}>
                          購物袋
                        </span>
                        <Link
                          to="/cart"
                          onClick={() => setIsCartOpen(false)}
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'white',
                            background: 'var(--color-brand-blue)',
                            padding: '6px 14px',
                            borderRadius: 980,
                            textDecoration: 'none',
                            transition: 'background 0.2s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--color-brand-coffee)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--color-brand-blue)';
                          }}
                        >
                          前往購物袋
                        </Link>
                      </div>

                      {/* 商品數量小字 */}
                      {cartItems && cartItems.length > 0 && (
                        <p style={{
                          fontSize: 12,
                          color: 'var(--color-gray-dark)',
                          marginBottom: 12,
                        }}>
                          購物袋裡有 {itemCount} 件商品
                        </p>
                      )}

                      {/* 商品列表 */}
                      {cartItems && cartItems.length > 0 ? (
                        <div className="cart-preview-items" style={{
                          borderTop: '1px solid rgba(0,0,0,0.06)',
                          marginBottom: 14,
                          maxHeight: 280,
                          overflowY: 'auto',
                          /* 捲軸樣式 */
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'var(--color-gray-light) transparent',
                        }}>
                          {cartItems.map((item, index) => (
                            <div
                              key={item.id ?? index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 0',
                                borderBottom: index < cartItems.length - 1
                                  ? '1px solid rgba(0,0,0,0.06)'
                                  : 'none',
                              }}
                            >
                              {/* 商品縮圖 */}
                              <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: 10,
                                overflow: 'hidden',
                                flexShrink: 0,
                                background: 'var(--color-bg-light)',
                                border: '1px solid var(--color-gray-light)',
                              }}>
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  /* 無圖片時的佔位符 */
                                  <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 22,
                                    color: 'var(--color-gray-dark)',
                                  }}>
                                    🐾
                                  </div>
                                )}
                              </div>

                              {/* 商品資訊 */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: 'var(--color-text-dark)',
                                  lineHeight: 1.35,
                                  marginBottom: 3,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {item.name}
                                </p>
                                {/* 規格（如 item.specs 或 item.variant 存在才顯示）*/}
                                {(item.specs || item.variant) && (
                                  <p style={{
                                    fontSize: 11,
                                    color: 'var(--color-gray-dark)',
                                    marginBottom: 4,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {item.specs || item.variant}
                                  </p>
                                )}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}>
                                  <span style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--color-brand-coffee)',
                                  }}>
                                    NT${((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}
                                  </span>
                                  {item.quantity > 1 && (
                                    <span style={{
                                      fontSize: 11,
                                      color: 'var(--color-gray-dark)',
                                    }}>
                                      （x{item.quantity}）
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* 空購物袋 */
                        <div style={{
                          textAlign: 'center',
                          padding: '20px 0',
                          color: 'var(--color-gray-dark)',
                          fontSize: 13,
                          borderTop: '1px solid rgba(0,0,0,0.06)',
                          borderBottom: '1px solid rgba(0,0,0,0.06)',
                          marginBottom: 14,
                        }}>
                          還沒有選好的商品
                        </div>
                      )}

                      {/* 底部連結（無任何 icon）*/}
                      <div className="cart-divider" style={{ margin: '0 0 10px' }} />
                      <ul className="cart-menu-links" style={{ margin: 0, padding: 0 }}>
                        <li>
                          <Link to="/order" onClick={() => setIsCartOpen(false)}>
                            訂單查詢
                          </Link>
                        </li>
                        <li>
                          <Link to="/favorites" onClick={() => setIsCartOpen(false)}>
                            我的收藏
                          </Link>
                        </li>
                        <div className="cart-divider" style={{ margin: '6px 0' }} />
                        {isLoggedIn ? (
                          <li>
                            <Link to="/account" onClick={() => setIsCartOpen(false)}>
                              會員中心
                            </Link>
                          </li>
                        ) : (
                          <>
                            <li>
                              <Link to="/login" onClick={() => setIsCartOpen(false)}>
                                登入帳號
                              </Link>
                            </li>
                            <li>
                              <Link to="/register" onClick={() => setIsCartOpen(false)}>
                                加入會員
                              </Link>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 用戶按鈕（桌機版）── */}
              <div
                className="user-menu-wrapper"
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                {isLoggedIn ? (
                  <>
                    {/* 已登入：顯示頭像 */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(!isUserMenuOpen);
                        setIsCartOpen(false);
                        setActiveDropdown(null);
                      }}
                      title={user?.name}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-coffee) 100%)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        boxShadow: isUserMenuOpen ? '0 0 0 3px rgba(0,49,83,0.15)' : 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {getInitials(user?.name)}
                    </button>

                    {/* 用戶下拉選單（無 icon）*/}
                    {isUserMenuOpen && (
                      <div className="cart-dropdown-overlay" style={{ minWidth: 220 }}>
                        <div className="cart-dropdown-content">
                          {/* 用戶資訊列 */}
                          <div style={{
                            padding: '4px 4px 12px',
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            marginBottom: 8,
                          }}>
                            <p style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--color-text-dark)',
                              marginBottom: 2,
                            }}>
                              {user?.name}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--color-gray-dark)' }}>
                              {user?.email}
                            </p>
                          </div>
                          <ul className="cart-menu-links">
                            <li>
                              <Link to="/account" onClick={() => setIsUserMenuOpen(false)}>
                                會員中心
                              </Link>
                            </li>
                            <li>
                              <Link to="/account#orders" onClick={() => setIsUserMenuOpen(false)}>
                                我的訂單
                              </Link>
                            </li>
                            <li>
                              <Link to="/account#favorites" onClick={() => setIsUserMenuOpen(false)}>
                                收藏清單
                              </Link>
                            </li>
                          </ul>
                          <div className="cart-divider" style={{ margin: '8px 0' }} />
                          <button
                            onClick={handleLogout}
                            style={{
                              width: '100%',
                              padding: '10px 8px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: 14,
                              fontWeight: 500,
                              color: '#e74c3c',
                              borderRadius: 8,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                          >
                            <LogOut size={14} /> 登出
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* 未登入：顯示登入按鈕 */
                  <Link
                    to="/login"
                    className="nav-login-btn"
                    style={{
                      padding: '6px 18px',
                      borderRadius: 980,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-brand-blue)',
                      border: '1.5px solid var(--color-brand-blue)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--color-brand-blue)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--color-brand-blue)';
                    }}
                  >
                    登入
                  </Link>
                )}
              </div>

              {/* 手機版漢堡按鈕 */}
              <button className="hamburger-btn" onClick={toggleMenu} aria-label="選單">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* 桌機版：Mega Menu */}
        <div className={`mega-menu ${activeDropdown ? 'show' : ''}`}>
          <div className="mega-menu-content">
            {activeDropdown === 'brand' && (
              <>
                <div className="mega-menu-column">
                  <h4>品牌故事</h4>
                  <Link to="/about" onClick={() => setActiveDropdown(null)}>品牌源由</Link>
                  <Link to="/founder" onClick={() => setActiveDropdown(null)}>創辦人故事</Link>
                  <Link to="/design-philosophy" onClick={() => setActiveDropdown(null)}>設計理念</Link>
                </div>
                <div className="mega-menu-column">
                  <h4>品質承諾</h4>
                  <Link to="/brand-promise" onClick={() => setActiveDropdown(null)}>品牌承諾</Link>
                  <Link to="/quality-assurance" onClick={() => setActiveDropdown(null)}>品質保證</Link>
                  <Link to="/customer-feedback" onClick={() => setActiveDropdown(null)}>顧客回饋</Link>
                </div>
              </>
            )}
            {activeDropdown === 'support' && (
              <>
                <div className="mega-menu-column">
                  <h4>線上服務</h4>
                  <Link to="/blog" onClick={() => setActiveDropdown(null)}>部落格專欄</Link>
                  <a
                    href="https://line.me/tw/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setActiveDropdown(null)}
                  >
                    LINE 官方客戶服務
                  </a>
                </div>
                <div className="mega-menu-column">
                  <h4>售後支援</h4>
                  <Link to="/order" onClick={() => setActiveDropdown(null)}>訂單查詢</Link>
                  <Link to="/register-product" onClick={() => setActiveDropdown(null)}>產品序號登記</Link>
                  <Link to="/faq" onClick={() => setActiveDropdown(null)}>常見問題 (FAQ)</Link>
                  
                </div>
              </>
            )}
            {activeDropdown === 'contact' && (
              <>
                <div className="mega-menu-column">
                  <h4>找我們說</h4>
                  <Link to="/contact" onClick={() => setActiveDropdown(null)}>專員聯繫</Link>
                </div>
                <div className="mega-menu-column">
                  <h4>直接與我們聊聊</h4>
                  <a
                    href="https://lin.ee/THZqvZ5r"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setActiveDropdown(null)}
                  >
                    LINE 官方帳號
                  </a>
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
    style={{ transform: mobileMenuDepth === 'main' ? 'translateX(0)' : 'translateX(-25%)' }}
  >

    {/* 第 1 層面板：主選單 */}
    <div className="nav-overlay-panel">
      <ul className="nav-links-mobile">
        <li><Link to="/products" onClick={toggleMenu}>商品列表</Link></li>
        <li><Link to="/joints" onClick={toggleMenu}>關節保健</Link></li>

        {/* 有子選單的項目 */}
        <li>
          <button
            className="nav-mobile-next-btn"
            onClick={() => setMobileMenuDepth('brand')}
          >
            品牌介紹 <span className="arrow">〉</span>
          </button>
        </li>
        <li>
          <button
            className="nav-mobile-next-btn"
            onClick={() => setMobileMenuDepth('support')}
          >
            服務支援 <span className="arrow">〉</span>
          </button>
        </li>
        <li>
          <button
            className="nav-mobile-next-btn"
            onClick={() => setMobileMenuDepth('contact')}
          >
            聯絡我們 <span className="arrow">〉</span>
          </button>
        </li>

        <li style={{
          marginTop: 16,
          borderTop: '1px solid var(--color-gray-light)',
          paddingTop: 16,
        }}>
          {isLoggedIn ? (
            <Link
              to="/account"
              onClick={toggleMenu}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-brand-blue), var(--color-brand-coffee))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {getInitials(user?.name)}
              </div>
              {user?.name} 的會員中心
            </Link>
          ) : (
            <Link to="/login" onClick={toggleMenu}>登入 / 加入會員</Link>
          )}
        </li>
      </ul>
    </div>

    {/* 第 2 層面板：動態次選單 */}
    <div className="nav-overlay-panel">
      <button
        className="nav-mobile-back-btn"
        onClick={() => setMobileMenuDepth('main')}
      >
        <span className="arrow">〈</span>
        {mobileMenuDepth === 'brand' ? ' 品牌介紹'
          : mobileMenuDepth === 'support' ? ' 服務支援'
          : mobileMenuDepth === 'contact' ? ' 聯絡我們'
          : ''}
      </button>

      {/* 品牌介紹內容 */}
      {mobileMenuDepth === 'brand' && (
        <ul className="nav-links-mobile sub-links">
          <li className="mobile-sub-title">品牌故事</li>
          <li><Link to="/about" onClick={toggleMenu}>品牌源由</Link></li>
          <li><Link to="/founder" onClick={toggleMenu}>創辦人故事</Link></li>
          <li><Link to="/design-philosophy" onClick={toggleMenu}>設計理念</Link></li>
          <li className="mobile-sub-title" style={{ marginTop: '24px' }}>品質承諾</li>
          <li><Link to="/brand-promise" onClick={toggleMenu}>品牌承諾</Link></li>
          <li><Link to="/quality-assurance" onClick={toggleMenu}>品質保證</Link></li>
          <li><Link to="/customer-feedback" onClick={toggleMenu}>顧客回饋</Link></li>
        </ul>
      )}

      {/* 服務支援內容 */}
      {mobileMenuDepth === 'support' && (
        <ul className="nav-links-mobile sub-links">
          <li className="mobile-sub-title">線上服務</li>
          <li><Link to="/blog" onClick={toggleMenu}>部落格專欄</Link></li>
          <li>
            <a href="https://line.me/tw/" target="_blank" rel="noreferrer" onClick={toggleMenu}>
              LINE 官方客戶服務
            </a>
          </li>
          <li className="mobile-sub-title" style={{ marginTop: '24px' }}>售後支援</li>
          <li><Link to="/order" onClick={toggleMenu}>訂單查詢</Link></li>
          <li><Link to="/register-product" onClick={toggleMenu}>產品序號登記</Link></li>
          <li><Link to="/faq" onClick={toggleMenu}>常見問題 (FAQ)</Link></li>
        </ul>
      )}

      {/* 聯絡我們內容 */}
      {mobileMenuDepth === 'contact' && (
        <ul className="nav-links-mobile sub-links">
          <li className="mobile-sub-title">找我們說</li>
          <li><Link to="/contact" onClick={toggleMenu}>專員聯繫</Link></li>
          <li className="mobile-sub-title" style={{ marginTop: '24px' }}>直接與我們聊聊</li>
          <li>
            <a href="https://lin.ee/THZqvZ5r" target="_blank" rel="noreferrer" onClick={toggleMenu}>
              LINE 官方帳號
            </a>
          </li>
        </ul>
      )}
    </div>

  </div>
</div>

      {/* ==================== 頁面路由區塊 ==================== */}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── 核心頁面 ── */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="founder" element={<Founder />} />
        <Route path="/design-philosophy" element={<Category title="設計理念" subtitle="以毛孩與飼主體驗為核心的品牌思維" />} />
        <Route path="/brand-promise" element={<Category title="品牌承諾" subtitle="從原料到服務，守住每一份信任" />} />
        <Route path="quality-assurance" element={<QualityAssurance />} />
        <Route path="/customer-feedback" element={<Category title="顧客回饋" subtitle="來自真實飼主與毛孩的使用分享" />} />
        <Route path="/order" element={<OrderQuery />} />

        {/* ── 購物流程 ── */}
        <Route path="/cart" element={<Cart />} />
        <Route path={ROUTES.CHECKOUT} element={<Checkout />} />
        <Route path={ROUTES.ORDER_CONFIRM} element={<OrderConfirm />} />

        {/* ── 會員系統 ── */}
        <Route path={ROUTES.ACCOUNT} element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/orders" element={<Account />} />
        <Route path="/favorites" element={<Account />} />
        <Route path="/register-product" element={<ProductRegister />} />

        {/* ── 商品分類 ── */}
        <Route path="/products" element={<Products title="所有商品" subtitle="探索 Polar 完整產品系列" />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/main-food" element={<Category title="主食系列" subtitle="滿足獵食天性的極致營養" />} />
        <Route path="/snacks" element={<Category title="原肉手工點心" subtitle="純粹無添加的週末幸福獎勵" />} />
        <Route path="/health" element={<Category title="極致保健" subtitle="保護牠清澈無瑕的雙眼與活力" />} />
        <Route path="/joints" element={<Category title="Polar Joints" subtitle="專為關節保健設計" />} />

        {/* ── 服務支援 ── */}
        <Route path="/support" element={<Category title="找我們說" subtitle="有問題，直接找我們。" />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/member-benefits" element={<MemberBenefits />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="blog"          element={<Blog />} />
        <Route path="blog/:slug"    element={<BlogDetail />} />
        <Route path="/faq" element={<Category title="常見問題" subtitle="服務條款與隱私政策" />} />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/500"                    element={<ServerError />} />
        <Route path="/reset-password"         element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/reset-password/:token"  element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* ── 404 Fallback（放最後）── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>

      {/* ==================== 頁尾區塊 ==================== */}
      <footer className="footer-global">
        <div className="footer-content">
          <p className="footer-mini-text">為毛孩，只放真正需要的。</p>
          <div className="footer-divider" />
          <div className="footer-nav">
            <div className="footer-column">
              <h4>找一找</h4>
              <ul>
                <li><Link to="/main-food">Polar 主食罐</Link></li>
                <li><Link to="/snacks">Polar 零食點心</Link></li>
                <li><Link to="/health">Polar 保健系列</Link></li>
                <li><Link to="/joints">Polar Joints</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>找我們說</h4>
              <ul>
                <li><Link to="/cart">購物袋</Link></li>
                <li><Link to="/order">訂單查詢</Link></li>
                <li><Link to="/faq">常見問題</Link></li>
                <li><Link to="/contact">聯絡我們</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>關於北極先生</h4>
              <ul>
                <li><Link to="/about">品牌故事</Link></li>
                <li><Link to="/member-benefits">會員權益說明</Link></li>
                <li><Link to="/blog">最新消息</Link></li>
                <li><Link to="/terms">服務條款</Link></li>
                <li><Link to="/privacy">隱私權政策</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ margin: 0 }}>{'© 2026 北極先生國際股份有限公司' + '\u3000' + '保留所有權利'}</p>
              <p style={{ margin: 0 }}>統一編號：95448000</p>
              <p style={{ margin: 0 }}>地址：臺中市西屯區何安里臺灣大道二段910號13樓之2</p>
            </div>
            <div className="footer-legal">
              <Link to="/privacy">隱私權政策</Link>
              <Link to="/terms">使用條款</Link>
            </div>
          </div>
        </div>
      </footer>
      <ConsentBanner />
    </div>
    </ErrorBoundary>
  );
}


// ==========================================
// App Entry
// ==========================================
function App() {
  useEffect(() => {
    // 已同意 Cookie 的回訪使用者，直接初始化 GA
    const consent = storage.get(CONFIG.COOKIE_CONSENT_KEY)
    if (consent?.analytics) {
      analytics.init()
    }
  }, [])

  return (
    <Router basename="/polar-pet-store">
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
