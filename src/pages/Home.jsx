import React from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import ExpandableCard from '../components/ExpandableCard';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Counter from '../components/common/Counter';
import jointSvg from '../png/joint.svg';
import brainGutAxisSvg from '../png/Brain-gut-axis.svg';
import pickyEateSvg from '../png/picky-eate.svg';
import jointCareProductSvg from '../png/joint-care-product.svg';
import catDogPasteSvg from '../png/Cat-Dog-paste.svg';

/* ─────────────────────────────────────────
   資料定義
───────────────────────────────────────── */
const TESTIMONIALS = [
    {
        avatar: '🐩',
        text: '家裡的貴賓挑食了三年，換了無數品牌。試了北極先生的原肉點心和鮮糧後，現在每天時間一到就在碗旁邊等，太感動了！',
        author: '陳小姐',
        location: '台北',
        pet: '貴賓 Poodle',
        rating: 5,
    },
    {
        avatar: '🐕',
        text: '原本狗狗腸胃很敏感，常常軟便。自從換了你們的精準微米蛋白配方，大便形狀變得超漂亮，精神也變好了，會一直回購！',
        author: '林先生',
        location: '台中',
        pet: '柴犬 Mochi',
        rating: 5,
    },
    {
        avatar: '🐈',
        text: '身為理科飼主，非常喜歡你們 100% 透明的產品履歷，掃描 QR code 就能看到檢驗報告，給毛孩吃非常安心。',
        author: '黃小姐',
        location: '高雄',
        pet: '米克斯 Kiki',
        rating: 5,
    },
];

const PARTNERS = [
    { name: 'PetHome 寵物家', logo: '/images/partners/pethome.png' },
    { name: '毛孩王國', logo: '/images/partners/kingdom.png' },
    { name: 'PCHOME', logo: '/images/partners/pchome.png' },
    { name: '蝦皮購物', logo: '/images/partners/shopee.png' },
    { name: 'momo 購物', logo: '/images/partners/momo.png' },
    { name: '全聯 PX Mart', logo: '/images/partners/pxmart.png' },
];

/* ─────────────────────────────────────────
   主元件
───────────────────────────────────────── */
const Home = () => {
    // 👇 所有區塊的動畫偵測器
    const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.2 });
    const [featuresRef, featuresVisible] = useScrollReveal({ threshold: 0.1 });
    const [stdRef, stdVisible] = useScrollReveal({ threshold: 0.15 });
    const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.1 });
    const [aboutRef, aboutVisible] = useScrollReveal({ threshold: 0.15 });
    const [transparencyRef, transparencyVisible] = useScrollReveal({ threshold: 0.15 });
    const [testiRef, testiVisible] = useScrollReveal({ threshold: 0.1 });
    const [ctaRef, ctaVisible] = useScrollReveal({ threshold: 0.2 });
    const [partnersRef, partnersVisible] = useScrollReveal({ threshold: 0.1 });

    return (
        <main style={{ overflow: 'hidden' }}>
            {/* ══════════════════════════════════════
                § 1  HERO — 輪播英雄區
            ══════════════════════════════════════ */}
            <HeroCarousel />

            {/* ══════════════════════════════════════
                § 2  STATS — 數字力量品質展示區
            ══════════════════════════════════════ */}
            <section className={`section-stats ${statsVisible ? 'reveal' : ''}`} ref={statsRef}>
                <div className="stats-header text-container">
                    <p className="kicker">為什麼選擇北極先生</p>
                    <h2 className="headline-regular">品質，重點都在這。</h2>
                    <p className="description-pro" style={{ color: 'var(--color-gray-dark)' }}>最嚴謹的配方設計標準，從原料溯源到成品出貨，全程透明可查。</p>
                </div>
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={96} shouldStart={statsVisible} />%
                        </span>
                        <span className="stat-desc">滿足適口性</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>毛孩家庭隨機抽樣調查</div>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={0} shouldStart={statsVisible} />
                        </span>
                        <span className="stat-desc">不必要添加物</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>無增稠劑、防腐劑、香料</div>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={13} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">臨床專家指導</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>深耕寵物營養與生活</div>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={42} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">飼主討論研究</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>打造貼近實際生活品質</div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 3  FEATURES — 精準營養對策 (ExpandableCards)
            ══════════════════════════════════════ */}
            <section className={`section-features ${featuresVisible ? 'reveal' : ''}`} ref={featuresRef}>
                <div className="stats-header text-container">
                    <p className="kicker">精準營養對策</p>
                    <h2 className="headline-regular">牠需要什麼？<br />我們準備好了。</h2>
                    <p className="description-pro" style={{ color:'var(--color-gray-dark)' }}>不同體質與需求，精準提供最合適。</p>
                </div>
                <div className="features-grid">
                    <ExpandableCard
                        id="feature-1"
                        title="關節"
                        subtitle="活動毛孩必備"
                        content="葡萄糖胺與軟骨素精準配比，守護每一步的靈活自在。讓毛孩從日常飲食中獲得最純粹的關節支撐力。"
                        image={jointSvg}
                    />
                    <ExpandableCard
                        id="feature-2"
                        title="腸胃+情緒"
                        subtitle="滿足情緒呵護腸胃"
                        content="益生菌搭配可溶性纖維，重建強健消化防線。我們將蛋白質精煉至微米級別，最高吸收率達 95%，告別腸胃困擾。"
                        image={brainGutAxisSvg}
                    />
                    <ExpandableCard
                        id="feature-3"
                        title="挑食剋星"
                        subtitle="極致美味征服挑剔味蕾"
                        content="第一原料保證真實肉類，絕無以次充好。保留生肉原有的酵素與香氣，讓每次開飯都成為牠最期待的時刻。"
                        image={pickyEateSvg}
                    />
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 4  FEATURED PRODUCT — 旗艦產品
            ══════════════════════════════════════ */}
            <section className={`section-standard ${stdVisible ? 'reveal' : ''}`} ref={stdRef}>
                <div className="text-container" style={{ padding: '0 24px' }}>
                    <p className="kicker">全新推出</p>
                    <h2 className="headline-regular">犬貓關節保健</h2>
                    <p className="description-pro" style={{ color: 'var(--color-gray-dark)' }}>
                        日常的每一餐，都可以營養又健康。葡萄糖胺 500mg / 每份，讓毛孩從食物中獲得最純粹的支撐。
                    </p>
                    <div className="btns-wrapper">
                        <Link to="/joints">
                            <button className="btn-blue">立即選購</button>
                        </Link>
                        <Link to="/joints">
                            <button className="btn-link">查看完整成分</button>
                        </Link>
                    </div>
                </div>
                <ImageWithFallback
                    src={jointCareProductSvg}
                    alt="犬貓關節保健"
                    className="std-image-wrapper"
                />
            </section>

            {/* ══════════════════════════════════════
                § 5  GRID — 雙欄產品展示
            ══════════════════════════════════════ */}
            <section className={`section-grid ${gridVisible ? 'reveal' : ''}`} ref={gridRef}>
                {/* 左側網格 */}
                <div className="grid-item">
                    <div className="text-container" style={{ padding: '0 36px' }}>
                        <p className="kicker">純粹系列</p>
                        <h3>原肉手工點心</h3>
                        <p style={{ color: 'var(--color-gray-dark)' }}>純粹無添加的週末獎勵。</p>
                        <div className="btns-wrapper" style={{ marginTop: '4px', justifyContent: 'center' }}>
                            <Link to="/snacks">
                                <button className="btn-blue" style={{ fontSize: '15px', padding: '8px 16px' }}>了解更多</button>
                            </Link>
                            <Link to="/snacks">
                                <button className="btn-link" style={{ fontSize: '15px' }}>立即選購</button>
                            </Link>
                        </div>
                    </div>
                    <ImageWithFallback
                        src={catDogPasteSvg}
                        alt="原肉手工點心"
                        className="grid-image-wrapper"
                    />
                </div>

                {/* 右側深色網格 */}
                <div className="grid-item dark">
                    <div className="text-container" style={{ padding: '0 36px' }}>
                        <p className="kicker" style={{ color: 'var(--color-brand-coffee-light)' }}>護眼系列</p>
                        <h3 style={{ color: 'var(--color-text-light)' }}>特級超級視力寶</h3>
                        <p style={{ color: 'rgba(252,249,242,0.68)' }}>保護牠清澈無瑕的雙眼。</p>
                        <div className="btns-wrapper" style={{ marginTop: '4px', justifyContent: 'center' }}>
                            <Link to="/health">
                                <button className="btn-blue" style={{ fontSize: '15px', padding: '8px 16px' }}>了解更多</button>
                            </Link>
                            <Link to="/health">
                                <button className="btn-link" style={{ color: 'var(--color-brand-coffee-light)', fontSize: '15px' }}>立即選購</button>
                            </Link>
                        </div>
                    </div>
                    <ImageWithFallback
                        src={brainGutAxisSvg}
                        alt="特級視力寶"
                        className="grid-image-wrapper"
                    />
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 6  ABOUT — 品牌故事
            ══════════════════════════════════════ */}
            <section
                className={`reveal-target ${aboutVisible ? 'reveal' : ''}`}
                ref={aboutRef}
                style={{
                    background: 'linear-gradient(180deg, var(--color-bg-light) 0%, var(--color-bg-white) 100%)',
                    padding: 'clamp(80px, 12vw, 160px) 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div className="text-container" style={{ maxWidth: 720, width: '100%', textAlign: 'left' }}>
                    <p className="kicker" style={{ textAlign: 'center' }}>關於北極先生</p>
                    <h2 className="headline-regular" style={{ textAlign: 'center', marginBottom: 48 }}>為了一份安心，<br />我們從零開始。</h2>
                    <p className="description-pro" style={{ maxWidth: '100%', marginBottom: 28 }}>
                        2024 年，北極先生正式誕生。身為資訊管理研究所的學生，我習慣用數據與邏輯看待世界。但當面對毛孩的飲食時，我發現市場上充滿了不透明的資訊與難以辨識的成分。
                    </p>
                    <blockquote
                        style={{
                            borderLeft: '3px solid var(--color-brand-coffee)',
                            margin: '36px 0',
                            padding: '12px 28px',
                            fontStyle: 'italic',
                            fontSize: 'clamp(19px, 2.5vw, 24px)',
                            lineHeight: 1.55,
                            color: 'var(--color-text-dark)',
                            fontWeight: 500,
                        }}
                    >
                        「既然找不到 100% 放心的食物，那就自己做吧。」
                    </blockquote>
                    <p className="description-pro" style={{ maxWidth: '100%', marginBottom: 0 }}>
                        為此，我親自尋訪台灣頂尖代工廠，從原料溯源到配方研發，堅持不妥協。目前由我一人全心營運，沒有大集團的包袱，只有將心比心的堅持，把最純粹的營養，送到每一個毛孩的餐桌上。
                    </p>
                    <div className="btns-wrapper" style={{ justifyContent: 'flex-start', marginTop: 40 }}>
                        <Link to="/about">
                            <button className="btn-blue">閱讀完整故事</button>
                        </Link>
                        <Link to="/about#lab">
                            <button className="btn-link">實驗室溯源</button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 7  TRANSPARENCY — 透明承諾
            ══════════════════════════════════════ */}
            <section
                className={`reveal-target ${transparencyVisible ? 'reveal' : ''}`}
                ref={transparencyRef}
                style={{
                    background: 'var(--color-bg-dark)',
                    padding: 'clamp(60px, 8vw, 100px) 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div className="text-container" style={{ textAlign: 'center', marginBottom: 60, maxWidth: 600 }}>
                    <p className="kicker" style={{ color: 'var(--color-brand-coffee-light)' }}>透明承諾</p>
                    <h2 className="headline-regular" style={{ color: 'var(--color-text-light)', fontSize: 'clamp(28px,4vw,44px)' }}>
                        每一份產品，都有據可查。
                    </h2>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 24,
                        maxWidth: 1080,
                        width: '100%',
                    }}
                >
                    {[
                        { icon: '🔬', title: '第三方SGS檢驗', desc: '每批次送驗，報告公開下載' },
                        { icon: '📦', title: '原料產地標示', desc: '掃碼即見完整溯源地圖' },
                        { icon: '📋', title: '配方比例公開', desc: '主原料用量精準標明' },
                        { icon: '🌡️', title: '冷鏈全程監控', desc: '從工廠到您家門口' },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="transparency-card"
                            style={{
                                background: 'var(--color-bg-dark-card)',
                                border: '1px solid rgba(198,142,88,0.18)',
                                borderRadius: 'var(--pet-border-radius)',
                                padding: '40px 28px',
                                textAlign: 'center',
                                transition: `all 0.6s cubic-bezier(0.25,1,0.5,1) ${i * 0.1}s`,
                                cursor: 'default',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-6px)';
                                e.currentTarget.style.borderColor = 'rgba(198,142,88,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(198,142,88,0.18)';
                            }}
                        >
                            <div style={{ fontSize: 44, marginBottom: 16 }}>{item.icon}</div>
                            <h4 style={{ color: 'var(--color-text-light)', fontWeight: 600, fontSize: 18, marginBottom: 10 }}>
                                {item.title}
                            </h4>
                            <p style={{ color: 'rgba(252,249,242,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 8  TESTIMONIALS — 真實評價
            ══════════════════════════════════════ */}
            <section
                className={`section-stats reveal-target ${testiVisible ? 'reveal' : ''}`}
                ref={testiRef}
                style={{ background: 'var(--color-bg-white)', paddingTop: 'clamp(80px,12vw,140px)', paddingBottom: 'clamp(80px,12vw,140px)' }}
            >
                <div className="stats-header">
                    <p className="kicker">真實評價</p>
                    <h2 className="headline-regular">聽聽毛孩家長怎麼說</h2>
                    <p className="description-pro">超過 500 位家長的親身體驗，用毛孩的反應說話。</p>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 28,
                        maxWidth: 1080,
                        width: '100%',
                        margin: '0 auto',
                        padding: '0 24px'
                    }}
                >
                    {TESTIMONIALS.map((t, i) => (
                        <div
                            key={i}
                            className="feature-card"
                            style={{ gap: 0, animationDelay: `${i * 0.15}s` }}
                        >
                            <div style={{ marginBottom: 16, letterSpacing: 2, color: 'var(--color-brand-coffee)' }}>
                                {'★'.repeat(t.rating)}
                            </div>
                            <div style={{ fontSize: 44, marginBottom: 16 }}>{t.avatar}</div>
                            <p
                                style={{
                                    fontSize: 16,
                                    lineHeight: 1.7,
                                    color: 'var(--color-text-dark)',
                                    fontStyle: 'italic',
                                    flex: 1,
                                    marginBottom: 24,
                                }}
                            >
                                「{t.text}」
                            </p>
                            <div style={{ borderTop: '1px solid var(--color-gray-light)', paddingTop: 16, width: '100%' }}>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-dark)', fontSize: 15 }}>
                                    — {t.location} {t.author}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--color-brand-coffee)', marginTop: 4 }}>
                                    & {t.pet}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 9  CTA BANNER — 無風險體驗
            ══════════════════════════════════════ */}
            <section
                className={`reveal-target ${ctaVisible ? 'reveal' : ''}`}
                ref={ctaRef}
                style={{
                    background: 'linear-gradient(135deg, var(--color-brand-blue) 0%, #00264D 100%)',
                    padding: 'clamp(80px, 12vw, 140px) 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: 400, height: 400, borderRadius: '50%', background: 'rgba(198,142,88,0.08)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(198,142,88,0.06)', pointerEvents: 'none' }} />

                <div className="text-container" style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
                    <p className="kicker" style={{ color: 'var(--color-brand-coffee-light)' }}>新客專屬</p>
                    <h2 className="headline-regular" style={{ color: 'var(--color-text-light)', fontSize: 'clamp(32px,5vw,56px)' }}>
                        100% 無風險體驗
                    </h2>
                    <p className="description-pro" style={{ maxWidth: '100%', color: 'rgba(252,249,242,0.75)', marginBottom: 0 }}>
                        毛孩不吃怎麼辦？別擔心！首次購買指定商品，享 <strong style={{ color: 'var(--color-brand-coffee-light)' }}>7 天不吃包退保證</strong>，讓您安心嘗試最好的營養。
                    </p>
                    <div className="btns-wrapper" style={{ marginTop: 40, justifyContent: 'center' }}>
                        <Link to="/products">
                            <button
                                className="btn-blue"
                                style={{ background: 'var(--color-brand-coffee)', padding: '16px 40px', fontSize: 18, boxShadow: '0 6px 24px rgba(139,90,43,0.35)' }}
                            >
                                立即開始體驗
                            </button>
                        </Link>
                        <Link to="/faq#guarantee">
                            <button className="btn-link" style={{ color: 'rgba(252,249,242,0.8)', fontSize: 16 }}>
                                退換貨說明
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 10 PARTNERS MARQUEE — 合作通路
            ══════════════════════════════════════ */}
            <section className={`section-partners ${partnersVisible ? 'reveal' : ''}`} ref={partnersRef}>
                <div className="partners-header text-container">
                    <h2 className="headline-regular" style={{ fontSize: '32px' }}>合作通路與夥伴</h2>
                    <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)', fontSize: '18px' }}>攜手為毛孩提供最安心的選擇</p>
                </div>

                <div className="marquee-container">
                    <div className="marquee-track">
                        {/* 兩組資料輪播以達到無縫效果 */}
                        {[...PARTNERS, ...PARTNERS].map((p, i) => (
                            <div key={i} className="partner-logo">
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
