import React, { useState } from 'react';

const Navbar = () => {
  // 控制漢堡選單的開關狀態
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* 頂部固定的極簡導覽列 */}
      <header className="navbar-apple">
        <div className="navbar-container">
          
          {/* 左側 Logo 區塊 */}
          <div className="nav-logo">
            <a href="/">
              {/* 請確認這裡的圖片路徑是你專案中正確的 Logo 路徑 */}
              <img src="/polar-logo.png" alt="Mr.Polar 北極先生" /> 
            </a>
          </div>

          {/* 右側功能區：搜尋、購物袋、漢堡選單 (=) */}
          <div className="nav-actions">
            <button className="icon-btn" aria-label="搜尋">🔍</button>
            <button className="icon-btn" aria-label="購物車">🛍️</button>
            
            {/* 漢堡選單按鈕 */}
            <button className="hamburger-btn" onClick={toggleMenu} aria-label="選單">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* 隱藏的滿版下拉選單 (點擊 ☰ 後滑出) */}
      <div className={`nav-overlay ${isMenuOpen ? 'open' : ''}`}>
        <ul className="nav-links-mobile">
          <li><a href="#about" onClick={toggleMenu}>品牌介紹</a></li>
          <li><a href="#products" onClick={toggleMenu}>骨骼關節</a></li>
          <li><a href="#shop" onClick={toggleMenu}>商品列表</a></li>
          <li><a href="#blog" onClick={toggleMenu}>部落格</a></li>
          <li><a href="#contact" onClick={toggleMenu}>聯絡我們</a></li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
