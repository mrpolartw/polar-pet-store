import React from 'react';
import HeroCarousel from '../components/HeroCarousel';
import ExpandableCard from '../components/ExpandableCard';

// 引入剛寫好的檔案
import ImageWithFallback from '../components/common/ImageWithFallback';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Counter from '../components/common/Counter';

const Home = () => {
    // 👇 把所有區塊的動畫偵測器都宣告出來
    const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.2 });
    const [featuresRef, featuresVisible] = useScrollReveal({ threshold: 0.1 });
    const [stdRef, stdVisible] = useScrollReveal({ threshold: 0.15 });
    const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.1 });

    return (
        <main>
            <HeroCarousel />

            {/* 第 2 區塊：更新內容與數字動畫 */}
            <section className={`section-stats ${statsVisible ? 'reveal' : ''}`} ref={statsRef}>
                <div className="stats-header text-container">
                    <h2 className="headline-regular">每一口，都是對牠的極致寵愛。</h2>
                    <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)' }}>我們將人類級別的最佳實踐，應用在牠的餐桌上。</p>
                </div>
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={96} shouldStart={statsVisible} />%
                        </span>
                        <span className="stat-desc">超高適口性回饋，滿足挑食的味蕾</span>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={0} shouldStart={statsVisible} />
                        </span>
                        <span className="stat-desc">人工色素與防腐劑零添加</span>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={7} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">臨床執業獸醫師探討</span>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={42} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">多位飼主合作實際產品開發落實生活</span>
                    </div>
                </div>
            </section>

            {/* 第 3 區塊：四大核心特色 (Feature Cards) */}
            <section className={`section-features ${featuresVisible ? 'reveal' : ''}`} ref={featuresRef}>
                <div className="stats-header text-container">
                    <h2 className="headline-regular">重點，都在這。</h2>
                    <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)' }}>熱銷推薦商品</p>
                </div>
                <div className="features-grid">
                    <ExpandableCard
                        id="feature-1"
                        title="精準微米蛋白"
                        subtitle="獨家專利水解技術"
                        content="將蛋白質精煉至微米級別，最高吸收率達 95%，告別腸胃敏感與軟便困擾。透過先進的微分子科技，讓毛孩的腸道能以最不費力的方式獲得最完整的胺基酸營養。"
                        image="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800"
                    />
                    <ExpandableCard
                        id="feature-2"
                        title="獸醫科學研發"
                        subtitle="15 位專家嚴格把關"
                        content="由擁有多國執照的臨床獸醫、動物營養師組成的專家團隊嚴格把關，每一個配方都經過三年以上的實證研發，確保每一項數值都符合國際 AAFCO 最新犬貓營養標準。"
                        image="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800"
                    />
                    <ExpandableCard
                        id="feature-3"
                        title="100% 透明履歷"
                        subtitle="從農場到餐桌全公開"
                        content="每一包含有專屬 QR Code。從農場源頭、生產製程，到最終雙盲檢驗報告，全公開透明，給您無可挑剔的安心。我們相信，真正的信任建立在完全的透明之上。"
                        image="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800"
                    />
                    <ExpandableCard
                        id="feature-4"
                        title="極致鎖鮮工藝"
                        subtitle="-40°C 醫療級冷凍乾燥"
                        content="-40°C 醫療級真空冷凍乾燥技術，完美保留生肉原有的酵素、維生素與礦物質，不流失任何一滴營養。每一口酥脆，都是鎖在冰點下的原汁原味。"
                        image="https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&q=80&w=800"
                    />
                </div>
            </section>

            {/* 第 4 區塊：大眾主打產品 (純淨白底質感) */}
            <section className={`section-standard ${stdVisible ? 'reveal' : ''}`} ref={stdRef}>
                <div className="text-container">
                    <p className="kicker">全新推出</p>
                    <h2 className="headline-regular">犬貓關節保健</h2>
                    <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)' }}>日常的每一餐，都可以營養又健康。</p>
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

            {/* 第 6 區塊 - 合作通路品牌展示 (無限滾動跑馬燈) */}
            <section className="section-partners">
                <div className="partners-header">
                    <h2 className="headline-regular" style={{ fontSize: '32px' }}>合作通路與夥伴</h2>
                    <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)', fontSize: '18px' }}>攜手為毛孩提供最安心的選擇</p>
                </div>

                <div className="marquee-container">
                    <div className="marquee-track">
                        {/* 第一組 */}
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="通路品牌 1" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" alt="通路品牌 2" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/Nestl%C3%A9_logo.svg" alt="通路品牌 3" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="通路品牌 4" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="通路品牌 5" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png" alt="通路品牌 6" /></div>

                        {/* 第二組 */}
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="通路品牌 1" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" alt="通路品牌 2" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/Nestl%C3%A9_logo.svg" alt="通路品牌 3" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="通路品牌 4" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="通路品牌 5" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png" alt="通路品牌 6" /></div>

                        {/* 第三組 */}
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="通路品牌 1" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" alt="通路品牌 2" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/Nestl%C3%A9_logo.svg" alt="通路品牌 3" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="通路品牌 4" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="通路品牌 5" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png" alt="通路品牌 6" /></div>

                        {/* 第四組 */}
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="通路品牌 1" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" alt="通路品牌 2" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/Nestl%C3%A9_logo.svg" alt="通路品牌 3" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="通路品牌 4" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="通路品牌 5" /></div>
                        <div className="partner-logo"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png" alt="通路品牌 6" /></div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;