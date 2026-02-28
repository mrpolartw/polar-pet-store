import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import About from './pages/About';
import Category from './pages/Category';
import CustomCursor from './components/CustomCursor';

// 切換路由時，自動將畫面捲軸移至最上方
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// 內部路由容器，可以取得目前的路由位置
function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // 判斷是否為首頁（'/'）
  const isHomePage = location.pathname === '/' || location.pathname === '';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // 進入新頁面時也要觸發一次檢查
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, location.pathname]);

  // 重點修復：如果「不是首頁」或者「使用者往下滑了」，強制讓導覽列顯示實心底色（也就是深色字體），以免被白色背景吃掉字白屏
  const navbarClass = `navbar ${(!isHomePage || scrolled) ? 'scrolled' : ''}`;

  return (
    <div className="app-container">
      <CustomCursor />
      <ScrollToTop />

      {/* 導覽列 Navbar (Global Ribbon) */}
      <nav className={navbarClass}>
        <div className="navbar-content">
          <Link to="/" className="logo">Polar</Link>
          <ul className="nav-links">
            <li><Link to="/">商品</Link></li>
            <li><Link to="/">關節專區</Link></li>
            <li><Link to="/">零食專區</Link></li>
            <li><Link to="/about">關於 Mr.Polar</Link></li>
            <li><Link to="/support">服務支援</Link></li>
          </ul>
          <div className="nav-actions">
            <span className="icon-search"></span>
            <span className="icon-cart"></span>
          </div>
        </div>
      </nav>

      {/* 路由切換區域 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/main-food" element={<Category title="主食系列" subtitle="滿足獵食天性的極致營養" />} />
        <Route path="/snacks" element={<Category title="原肉手工點心" subtitle="純粹無添加的週末幸福獎勵" />} />
        <Route path="/health" element={<Category title="極致保健" subtitle="保護牠清澈無瑕的雙眼與活力" />} />
        <Route path="*" element={<Home />} /> {/* 找不到的路由強制導回首頁 */}
      </Routes>

      {/* 頁尾 Footer */}
      <footer className="footer-global">
        <div className="footer-content">
          <p className="footer-mini-text">
            * 98% 含肉量為 Polar Pro 凍乾系列乾物比計算結果。實際營養比例可能因不同產品線而有所微調。<br />
            * 專屬透明履歷功能需配合最新版的 Polar 應用程式使用，並確保您的智慧型裝置具備 QR Code 掃描功能。<br />
            * 獸醫師團隊由多國臨床醫師組成，產品並非用作取代專業醫療診斷，若有特定疾病請諮詢您的家庭獸醫師。
          </p>
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
            <p>Copyright © 2026 Polar Inc. 保留一切權利。</p>
            <div className="footer-legal">
              <Link to="/">隱私權政策</Link> | <Link to="/">使用條款</Link> | <Link to="/">銷售及退款</Link> | <Link to="/">網站地圖</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
