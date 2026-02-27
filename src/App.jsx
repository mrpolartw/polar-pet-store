import React, { useEffect, useState, useRef } from 'react';
import './App.css';

// 穩固的圖片佔位符元件
const ImageWithFallback = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgSrc('https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1200'); // 至少給一個備用的漂亮圖片
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`img-wrapper ${isLoading ? 'loading' : 'loaded'} ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
      />
      {isLoading && <div className="skeleton-loader"></div>}
    </div>
  );
};

// 處理進入畫面時的動畫特效 Hook
const useScrollReveal = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: options.threshold || 0.15,
      ...options
    });

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options.threshold]);

  return [ref, isVisible];
};


function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // 各區塊的 Reveal Hook
  const [proRef, proVisible] = useScrollReveal({ threshold: 0.1 });
  const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.2 });
  const [featuresRef, featuresVisible] = useScrollReveal({ threshold: 0.1 });
  const [stdRef, stdVisible] = useScrollReveal({ threshold: 0.15 });
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.1 });

  return (
    <div className="app-container">
      {/* 導覽列 Navbar (Global Ribbon) */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          <div className="logo">Polar</div>
          <ul className="nav-links">
            <li><a href="#store">商店</a></li>
            <li><a href="#mac">主食系列</a></li>
            <li><a href="#ipad">零食點心</a></li>
            <li><a href="#iphone">極致保健</a></li>
            <li><a href="#watch">生活周邊</a></li>
            <li><a href="#support">支援服務</a></li>
          </ul>
          <div className="nav-actions">
            <span className="icon-search"></span>
            <span className="icon-cart"></span>
          </div>
        </div>
      </nav>

      <main>
        {/* 第 1 區塊：旗艦產品 (Pro系列質感) */}
        <section className={`section-pro ${proVisible ? 'reveal' : ''}`} ref={proRef}>
          <div className="text-container">
            <h1 className="headline-pro">Polar Pro</h1>
            <p className="subhead-pro">重新定義，頂級寵物營養學。</p>
            <p className="description-pro">以航太級凍乾鎖鮮技術，封存來自純淨海域與農場的最原始精華。</p>
            <div className="btns-wrapper">
              <button className="btn-blue">進一步了解</button>
              <button className="btn-link">購買</button>
            </div>
          </div>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=2400"
            alt="Polar Pro 營養主食"
            className="pro-image-wrapper"
          />
        </section>

        {/* 第 2 區塊：大字數據特色 (Apple 經典數據展示) */}
        <section className={`section-stats ${statsVisible ? 'reveal' : ''}`} ref={statsRef}>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-desc">超高含肉量，滿足獵食天性</span>
            </div>
            <div className="stat-item divider"></div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-desc">人工色素與防腐劑零添加</span>
            </div>
            <div className="stat-item divider"></div>
            <div className="stat-item">
              <span className="stat-number">10+</span>
              <span className="stat-desc">頂尖臨床獸醫師共同研發</span>
            </div>
          </div>
        </section>

        {/* 第 3 區塊：四大核心特色 (Feature Cards) */}
        <section className={`section-features ${featuresRef ? 'reveal' : ''}`} ref={featuresRef}>
          <div className="features-header text-container">
            <h2 className="headline-regular">每一口，都是對牠的極致寵愛。</h2>
            <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)' }}>我們將人類級別的最佳實踐，應用在牠的餐桌上。</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧬</div>
              <h3>精準微米蛋白</h3>
              <p>獨家專利水解技術，將蛋白質精煉至微米級別，最高吸收率達 95%，告別腸胃敏感與軟便困擾。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👩‍⚕️</div>
              <h3>獸醫科學研發</h3>
              <p>由 15 位擁有多國執照的臨床獸醫、動物營養師組成的專家團隊嚴格把關，每一個配方都經過三年以上的實證研發。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>100% 透明履歷</h3>
              <p>每一包含有專屬 QR Code。從農場源頭、生產製程，到最終雙盲檢驗報告，全公開透明，給您無可挑剔的安心。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧊</div>
              <h3>極致鎖鮮工藝</h3>
              <p>-40°C 醫療級真空冷凍乾燥技術，完美保留生肉原有的酵素、維生素與礦物質，不流失任何一滴營養。</p>
            </div>
          </div>
        </section>

        {/* 第 4 區塊：大眾主打產品 (純淨白底質感) */}
        <section className={`section-standard ${stdVisible ? 'reveal' : ''}`} ref={stdRef}>
          <div className="text-container">
            <p className="kicker">全新推出</p>
            <h2 className="headline-regular">Polar 鮮糧</h2>
            <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)' }}>日常的每一餐，都可以是無與倫比的享受。</p>
            <div className="btns-wrapper">
              <button className="btn-blue">進一步了解</button>
              <button className="btn-link">購買</button>
            </div>
          </div>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=2400"
            alt="Polar 鮮糧"
            className="std-image-wrapper"
          />
        </section>

        {/* 第 5 區塊：產品網格 (Grid) */}
        <section className={`section-grid ${gridVisible ? 'reveal' : ''}`} ref={gridRef}>
          {/* 左側網格 */}
          <div className="grid-item">
            <div className="text-container">
              <h3>原肉手工點心</h3>
              <p>純粹無添加的週末獎勵。</p>
              <div className="btns-wrapper" style={{ marginTop: '4px' }}>
                <button className="btn-blue" style={{ fontSize: '15px', padding: '8px 16px' }}>進一步了解</button>
                <button className="btn-link" style={{ fontSize: '15px' }}>購買</button>
              </div>
            </div>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200"
              alt="原肉手工點心"
              className="grid-image-wrapper"
            />
          </div>

          {/* 右側深色網格 */}
          <div className="grid-item dark">
            <div className="text-container">
              <h3>特級超級視力寶</h3>
              <p style={{ color: 'var(--color-gray-light)' }}>保護牠清澈無瑕的雙眼。</p>
              <div className="btns-wrapper" style={{ marginTop: '4px' }}>
                <button className="btn-blue" style={{ fontSize: '15px', padding: '8px 16px' }}>進一步了解</button>
                <button className="btn-link" style={{ fontSize: '15px' }}>購買</button>
              </div>
            </div>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=1200"
              alt="特級視力寶"
              className="grid-image-wrapper"
            />
          </div>
        </section>
      </main>

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
                <li><a href="#">Polar Pro</a></li>
                <li><a href="#">Polar 鮮糧</a></li>
                <li><a href="#">點心與零食</a></li>
                <li><a href="#">保健品</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>服務</h4>
              <ul>
                <li><a href="#">定期定額配送</a></li>
                <li><a href="#">全額退款保證</a></li>
                <li><a href="#">會員點數回饋</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>關於 Polar</h4>
              <ul>
                <li><a href="#">品牌故事</a></li>
                <li><a href="#">獸醫團隊</a></li>
                <li><a href="#">社會責任</a></li>
                <li><a href="#">就業機會</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>Copyright © 2026 Polar Inc. 保留一切權利。</p>
            <div className="footer-legal">
              <a href="#">隱私權政策</a> | <a href="#">使用條款</a> | <a href="#">銷售及退款</a> | <a href="#">網站地圖</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
