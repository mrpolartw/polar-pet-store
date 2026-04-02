import React from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import ExpandableCard from '../components/ExpandableCard';
import ImageWithFallback from '../components/common/ImageWithFallback';
import SEOHead from '../components/common/SEOHead';
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
        text: '我家貴賓從小腸胃不好，試了很多牌子都不穩定。用了北極先生兩個月，軟便的狀況幾乎不見了，獸醫說腸道狀態進步很多。',
        author: '王小姐',
        location: '台北',
        pet: '貴賓 Latte',
        rating: 5,
    },
    {
        avatar: '🐱',
        text: '貓很挑食，一般肉泥根本不碰。這款他不只願意吃，還每次都吃光光。成分我也看過，很乾淨，沒有什麼看不懂的東西。',
        author: '陳先生',
        location: '台中',
        pet: '英短 Mochi',
        rating: 5,
    },
    {
        avatar: '🐕',
        text: '狗狗七歲了，最近開始走路有點卡。獸醫建議補充關節保健，試了北極先生之後明顯靈活很多。包裝上有 QR code 可以查成分來源，這個我很喜歡。',
        author: '林媽媽',
        location: '高雄',
        pet: '柴犬 Kiki',
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
            <SEOHead
                title="寵物健康食品首席"
                description="北極先生，台灣優質寵物首席健康食品。天然食材、獸醫推薦、飼主合作共同設計、開發、打造最符合生活，給毛孩只給他需要的。"
                canonicalUrl="/"
            />
            {/* ══════════════════════════════════════
                § 1  HERO — 輪播英雄區
            ══════════════════════════════════════ */}
            <HeroCarousel />

            {/* ══════════════════════════════════════
                § 2  STATS — 數字力量品質展示區
            ══════════════════════════════════════ */}
            <section className={`section-stats ${statsVisible ? 'reveal' : ''}`} ref={statsRef}>
                <div className="stats-header text-container">
                    <p className="kicker">用數字說話</p>
                    <h2 className="headline-regular">飼主給我們的信任</h2>
                    <p className="description-pro" style={{ color: 'var(--color-gray-dark)' }}>每一個數字背後，都是一個選擇相信我們的家庭。</p>
                </div>
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={96} shouldStart={statsVisible} />%
                        </span>
                        <span className="stat-desc">毛孩願意吃完</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>來自真實毛孩家庭回饋</div>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={0} shouldStart={statsVisible} />
                        </span>
                        <span className="stat-desc">不放多餘的</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>不放香料、防腐劑、增稠劑</div>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={13} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">一起反覆打磨</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>和不同背景夥伴長期討論</div>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={42} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">真實回饋整理</span>
                        <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginTop: 4 }}>把生活裡的問題慢慢修正</div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 3  FEATURES — 精準營養對策 (ExpandableCards)
            ══════════════════════════════════════ */}
            <section className={`section-features ${featuresVisible ? 'reveal' : ''}`} ref={featuresRef}>
                <div className="stats-header text-container">
                    <p className="kicker">毛孩真正需要的</p>
                    <h2 className="headline-regular">三個最常見的健康問題</h2>
                    <p className="description-pro" style={{ color:'var(--color-gray-dark)' }}>點開每一張卡片，了解我們怎麼做。</p>
                </div>
                <div className="features-grid">
                    <ExpandableCard
                        id="feature-1"
                        title="關節，從吃開始顧"
                        subtitle="毛孩跑跳的每一步，都需要支撐。"
                        content={`關節問題往往在症狀出現前早就開始了。
北極先生關節保健肉泥含有膠原蛋白、鱸魚萃取等天然成分，
幫助毛孩維持關節靈活——從日常飲食開始，不用等到出問題才處理。`}
                        image={jointSvg}
                    />
                    <ExpandableCard
                        id="feature-2"
                        title="腸胃好，什麼都好"
                        subtitle="95% 的免疫力，從腸道來。"
                        content={`腸道是毛孩健康的根本。
消化不好、反覆軟便、挑食——這些都可能是腸道菌叢失衡的訊號。
北極先生腸胃保健肉泥以益生菌、南瓜、地瓜等食材為核心，
幫助毛孩建立穩定的消化環境，讓每一頓飯都真正被吸收。`}
                        image={brainGutAxisSvg}
                    />
                    <ExpandableCard
                        id="feature-3"
                        title="挑食的毛孩，也會想吃"
                        subtitle="天然食材的香氣，不靠化學誘食劑。"
                        content={`挑食不一定是個性問題——有時候是食物本身不夠好。
北極先生的肉泥以真實肉類為主原料，不添加人工香料或誘食劑，
讓毛孩聞到的、吃到的，都是真實食材的味道。
一旦試過，大多數挑食毛孩都願意吃。`}
                        image={pickyEateSvg}
                    />
                </div>
            </section>

            {/* ══════════════════════════════════════
                § 4  FEATURED PRODUCT — 旗艦產品
            ══════════════════════════════════════ */}
            <section className={`section-standard ${stdVisible ? 'reveal' : ''}`} ref={stdRef}>
                <div className="text-container" style={{ padding: '0 24px' }}>
                    <p className="kicker">現在就可以試試</p>
                    <h2 className="headline-regular">從這一款開始</h2>
                    <p className="description-pro" style={{ color: 'var(--color-gray-dark)' }}>
                        低熱量、低鈉、天然食材——
                        一款讓毛孩吃得開心、你也放心的保健肉泥。
                    </p>
                    <div className="btns-wrapper">
                        <Link to="/joints">
                            <button className="btn-blue">看看這款</button>
                        </Link>
                        <Link to="/joints">
                            <button className="btn-link">看看成分</button>
                        </Link>
                    </div>
                </div>
                <ImageWithFallback
                    src={jointCareProductSvg}
                    alt="犬貓關節保健"
                    className="std-image-wrapper"
                    loading="lazy"
                    decoding="async"
                />
            </section>

            {/* ══════════════════════════════════════
                § 5  GRID — 雙欄產品展示
            ══════════════════════════════════════ */}
            <section className={`section-grid ${gridVisible ? 'reveal' : ''}`} ref={gridRef}>
                {/* 左側網格 */}
                <div className="grid-item">
                    <div className="text-container" style={{ padding: '0 36px' }}>
                        <p className="kicker">零食點心</p>
                        <h3>每一口都值得。</h3>
                        <p style={{ color: 'var(--color-gray-dark)' }}>
                            天然食材做的點心——給牠獎勵，也給牠好的。
                        </p>
                        <div className="btns-wrapper" style={{ marginTop: '4px', justifyContent: 'center' }}>
                            <Link to="/snacks">
                                <button className="btn-blue" style={{ fontSize: '15px', padding: '8px 16px' }}>看看零食</button>
                            </Link>
                            <Link to="/snacks">
                                <button className="btn-link" style={{ fontSize: '15px' }}>了解成分</button>
                            </Link>
                        </div>
                    </div>
                    <ImageWithFallback
                        src={catDogPasteSvg}
                        alt="原肉手工點心"
                        className="grid-image-wrapper"
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                {/* 右側深色網格 */}
                <div className="grid-item dark">
                    <div className="text-container" style={{ padding: '0 36px' }}>
                        <p className="kicker" style={{ color: 'var(--color-brand-coffee-light)' }}>保健機能</p>
                        <h3 style={{ color: 'var(--color-text-light)' }}>不只是吃飽。</h3>
                        <p style={{ color: 'rgba(252,249,242,0.68)' }}>每一款都為特定需求設計——從腸胃到關節，找到牠需要的那款。</p>
                        <div className="btns-wrapper" style={{ marginTop: '4px', justifyContent: 'center' }}>
                            <Link to="/health">
                                <button className="btn-blue" style={{ fontSize: '15px', padding: '8px 16px' }}>看看保健品</button>
                            </Link>
                            <Link to="/health">
                                <button className="btn-link" style={{ color: 'var(--color-brand-coffee-light)', fontSize: '15px' }}>怎麼選？</button>
                            </Link>
                        </div>
                    </div>
                    <ImageWithFallback
                        src={brainGutAxisSvg}
                        alt="特級視力寶"
                        className="grid-image-wrapper"
                        loading="lazy"
                        decoding="async"
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
                    <p className="kicker" style={{ textAlign: 'center' }}>北極先生是怎麼來的</p>
                    <h2 className="headline-regular" style={{ textAlign: 'center', marginBottom: 48 }}>不是只賣東西，<br />是一直陪著你。</h2>
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
                        「我們希望每一個毛孩家庭，<br />都有一個可以信任的地方。」
                    </blockquote>
                    <p className="description-pro" style={{ maxWidth: '100%', marginBottom: 0 }}>
                        北極先生從一款保健肉泥開始，
                        帶著一個很簡單的想法——只放毛孩真正需要的。
                        我們想做的，是一個可以長久陪伴毛孩家庭的品牌。
                    </p>
                    <div className="btns-wrapper" style={{ justifyContent: 'flex-start', marginTop: 40 }}>
                        <Link to="/about">
                            <button className="btn-blue">看看我們的故事</button>
                        </Link>
                        <Link to="/about">
                            <button className="btn-link">了解我們</button>
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
                    <p className="kicker" style={{ color: 'var(--color-brand-coffee-light)' }}>我們沒有什麼秘密</p>
                    <h2 className="headline-regular" style={{ color: 'var(--color-text-light)', fontSize: 'clamp(28px,4vw,44px)' }}>
                        天然的東西，說清楚就好
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
                        {
                            icon: '🌿',
                            title: '成分看得懂',
                            desc: '每一樣食材，你在廚房裡就認得出來。沒有複雜的化學名稱，只有真正的食物。',
                        },
                        {
                            icon: '💚',
                            title: '吃得剛好',
                            desc: '低熱量、低鈉——不是為了噱頭，是因為這樣對毛孩的身體才是真的好。',
                        },
                        {
                            icon: '🛡️',
                            title: '不加多餘的',
                            desc: '沒有用不到的成分。少即是多，對毛孩來說也是。',
                        },
                        {
                            icon: '🐾',
                            title: '從食材開始在乎',
                            desc: '北極熊只吃自己獵來的。我們也只用真正在意的食材。',
                        },
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
                    <p className="kicker">他們怎麼說</p>
                    <h2 className="headline-regular">飼主說的，比我們說的更真實</h2>
                    <p className="description-pro">來自真實飼主的回饋。</p>
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
                    <p className="kicker" style={{ color: 'var(--color-brand-coffee-light)' }}>準備好了嗎</p>
                    <h2 className="headline-regular" style={{ color: 'var(--color-text-light)', fontSize: 'clamp(32px,5vw,56px)' }}>
                        從今天開始，<br />替牠選好一點的。
                    </h2>
                    <p className="description-pro" style={{ maxWidth: '100%', color: 'rgba(252,249,242,0.75)', marginBottom: 0 }}>
                        <strong>第一次訂購？</strong>
                        讓我們幫你找最適合毛孩的那一款。
                    </p>
                    <div className="btns-wrapper" style={{ marginTop: 40, justifyContent: 'center' }}>
                        <Link to="/products">
                            <button
                            className="btn-blue"
                                style={{ background: 'var(--color-brand-coffee)', padding: '16px 40px', fontSize: 18, boxShadow: '0 6px 24px rgba(139,90,43,0.35)' }}
                            >
                                幫毛孩找一款
                            </button>
                        </Link>
                        <Link to="/terms">
                            <button className="btn-link" style={{ color: 'rgba(252,249,242,0.8)', fontSize: 16 }}>
                                了解購物保障
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
                    <h2 className="headline-regular" style={{ fontSize: '32px' }}>你在哪裡，就在哪裡找到我們</h2>
                    <p className="subhead-pro" style={{ color: 'var(--color-gray-dark)', fontSize: '18px' }}>各大通路都有北極先生</p>
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
