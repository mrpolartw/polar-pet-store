import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SEOHead } from '../../components/common'
import './Blog.css'

export const BLOG_CATEGORIES = [
  { key: 'all',      label: '全部' },
  { key: 'dog',      label: '狗狗知識' },
  { key: 'cat',      label: '貓咪知識' },
  { key: 'news',     label: '最新消息' },
  { key: 'promo',    label: '優惠資訊' },
  { key: 'guide',    label: '產品指南' },
]

export const BLOG_POSTS = [
  {
    slug:      'picky-eater-nutrition',
    category:  'dog',
    emoji:     '🐶',
    title:     '挑食毛孩怎麼補營養？從適口性與腸胃耐受開始',
    excerpt:   '把挑食拆成食材香氣、質地接受度與消化反應三件事，選品與轉食會更有方向。',
    readTime:  '5 分鐘',
    date:      '2026-03-20',
    content: `
## 為什麼毛孩會挑食？

挑食行為通常來自三個根本原因：**食材香氣不足**、**質地不符合偏好**，以及**腸胃對新食材的敏感反應**。

### 香氣是第一關

貓狗的嗅覺遠比人類敏銳，食物的氣味是牠們判斷「能不能吃」的第一道關卡。如果零食的腥味或肉味不夠明顯，部分毛孩會直接拒絕。

**建議做法：**
- 選擇單一蛋白質、原肉成分高的零食
- 避免香料、人工香精添加的商品
- 初次嘗試可將零食輕微加熱（約 30°C）提升香氣

### 質地的接受度因犬貓而異

有些毛孩偏好酥脆口感，有些喜歡柔軟有嚼勁的質地。強行給予不喜歡質地的食物，只會加深挑食行為。

### 腸胃耐受需要時間

轉食時若速度過快，腸胃菌叢來不及適應，容易出現軟便或嘔吐，毛孩便會將「不舒服」與「新食物」連結，形成條件反射式拒食。

**轉食建議比例：**
- 第 1-3 天：新食 25% + 舊食 75%
- 第 4-6 天：新食 50% + 舊食 50%
- 第 7-10 天：新食 75% + 舊食 25%
- 第 11 天起：完全換成新食
    `,
  },
  {
    slug:      'cat-daily-care-guide',
    category:  'cat',
    emoji:     '🐱',
    title:     '貓咪日常照護全指南：從飲食到情緒的完整照護',
    excerpt:   '貓咪是獨立但敏感的動物，了解牠們的需求，才能給予最適合的照護方式。',
    readTime:  '7 分鐘',
    date:      '2026-03-15',
    content: `
## 貓咪的基本飲食需求

貓是絕對的肉食性動物，蛋白質是牠們最重要的營養來源。不同於狗狗，貓咪無法自行合成牛磺酸，必須從食物中攝取。

### 每日飲水量

成貓每日需要攝取的水分約為體重（kg）× 50ml。乾糧貓咪容易水分攝取不足，建議搭配濕食或使用流動飲水器提升飲水意願。

### 情緒健康同樣重要

貓咪雖然表面獨立，但對環境變化和主人情緒其實非常敏感。固定的作息、足夠的垂直空間，以及每日 15-30 分鐘的互動遊戲，都能有效降低焦慮行為。
    `,
  },
  {
    slug:      '2026-spring-new-products',
    category:  'news',
    emoji:     '🌸',
    title:     '2026 春季新品上市！關節保健系列全面升級',
    excerpt:   '新配方加入玻尿酸與薑黃萃取，臨床測試顯示 8 週後關節活動度提升 23%。',
    readTime:  '3 分鐘',
    date:      '2026-03-10',
    content: `
## 2026 春季新品正式上市

我們很興奮地宣布，Mr.Polar 北極先生 2026 春季新品系列正式推出！

### 關節保健系列全面升級

新一代關節保健零食在原有的葡萄糖胺配方基礎上，加入了：
- **玻尿酸（HA）**：幫助關節滑液補充，改善關節潤滑度
- **薑黃萃取（Curcumin）**：天然抗氧化成分，降低關節發炎反應
- **Omega-3 魚油**：EPA + DHA 雙效配方，支持全身抗發炎

### 臨床測試數據

與台灣大學獸醫學院合作進行的 8 週臨床測試顯示：
- 關節活動度提升 **23%**
- 步態評分改善 **31%**
- 主人滿意度達 **94%**
    `,
  },
  {
    slug:      'spring-promo-2026',
    category:  'promo',
    emoji:     '🎁',
    title:     '春季優惠開跑！買三送一限時活動',
    excerpt:   '即日起至 4/30，全館任選三件正價品即贈一件同款商品，最高省下 NT$600。',
    readTime:  '2 分鐘',
    date:      '2026-03-08',
    content: `
## 春季優惠活動說明

### 活動內容
- 活動期間：2026/03/08 – 2026/04/30
- 活動規則：全館任選三件正價品，即贈一件同款商品（以最低價品為贈品）
- 最高省下 NT$600

### 注意事項
- 不與其他優惠折扣併用
- 贈品以庫存為準，售完不補
- 限會員購買，非會員請先完成註冊
    `,
  },
  {
    slug:      'how-to-choose-supplement',
    category:  'guide',
    emoji:     '📖',
    title:     '如何挑選適合毛孩的機能保健零食？5 個選購要點',
    excerpt:   '市面上保健零食琳瑯滿目，從成分表到認證標章，教你看懂包裝背後的真相。',
    readTime:  '6 分鐘',
    date:      '2026-03-01',
    content: `
## 選購機能保健零食的 5 個要點

### 1. 先看蛋白質來源

優質的機能零食，主要成分應該是「可識別的真實肉品」，例如「雞胸肉」、「鮭魚」，而非「家禽副產品」或「肉粉」。

### 2. 確認有效成分含量

機能性零食的核心價值在於「有效成分的足量攝取」。以葡萄糖胺為例，犬貓每日有效劑量約為體重（kg）× 20mg，選購時需確認每份的實際含量是否足夠。

### 3. 檢查添加物清單

以下成分建議避開：
- 人工色素（Red 40、Blue 2）
- 防腐劑（BHA、BHT、Ethoxyquin）
- 人工甜味劑（尤其是木糖醇，對狗狗有毒）

### 4. 認識認證標章

- **SGS** = 第三方食品安全檢驗
- **HACCP** = 生產流程安全管理認證
- **GMP** = 優良製造規範

### 5. 參考真實使用者回饋

不要只看品牌官方說明，應查看有照片或影片佐證的真實飼主心得。
    `,
  },
  {
    slug:      'dog-weight-management',
    category:  'dog',
    emoji:     '⚖️',
    title:     '狗狗體重控制全攻略：判斷肥胖與健康減重方法',
    excerpt:   '超過 50% 的台灣寵物犬有超重問題，學會用 BCS 評分判斷，再搭配飲食調整。',
    readTime:  '5 分鐘',
    date:      '2026-02-20',
    content: `
## 如何判斷狗狗是否過重？

### 使用 BCS 體態評分（Body Condition Score）

BCS 是獸醫師常用的體態評估工具，分為 1-9 分：
- **1-3 分**：過瘦
- **4-5 分**：理想體重
- **6-7 分**：過重
- **8-9 分**：肥胖

### 簡易自我評估方法

1. **肋骨觸摸測試**：用手輕壓狗狗胸側，應能明顯感受到肋骨，但不突出
2. **腰線觀察**：從上方看，腰部應有明顯內縮
3. **腹部線條**：從側面看，腹部應略微上收

### 健康減重策略

- 每週減重目標控制在目前體重的 **1-2%**
- 以低熱量、高蛋白的零食替代一般零食
- 增加每日散步時間，加入輕度游泳或玩球訓練
    `,
  },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: 'easeOut' },
  }),
}

function BlogCard({ post, index }) {
  const formattedDate = new Date(post.date).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index}
      layout
    >
      <Link to={`/blog/${post.slug}`} className="blog-card">
        <div className="blog-card__cover">
          {post.coverImage
            ? <img src={post.coverImage} alt={post.title} />
            : <span className="blog-card__cover-emoji">{post.emoji}</span>
          }
        </div>
        <div className="blog-card__body">
          <div className="blog-card__meta">
            <span className="blog-card__category">
              {BLOG_CATEGORIES.find(c => c.key === post.category)?.label ?? post.category}
            </span>
            <span className="blog-card__read-time">📖 {post.readTime}</span>
          </div>
          <h2 className="blog-card__title">{post.title}</h2>
          <p className="blog-card__excerpt">{post.excerpt}</p>
          <div className="blog-card__footer">
            <span className="blog-card__date">{formattedDate}</span>
            <ArrowRight size={16} className="blog-card__arrow" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredPosts = activeCategory === 'all'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory)

  return (
    <main className="blog-page">
      <SEOHead
        title="Polar Journal 寵物生活誌"
        description="用更容易消化的內容，整理毛孩營養、保健與生活照護重點。Polar 對寵物健康日常的觀察與實用提案。"
        canonicalUrl="/blog"
      />

      {/* Hero */}
      <section className="blog-hero">
        <p className="blog-hero__kicker">POLAR JOURNAL</p>
        <h1 className="blog-hero__title">寵物電子生活誌</h1>
        <p className="blog-hero__desc">
          用更容易消化的內容，整理毛孩營養、保健與生活照護重點。
          這裡會持續更新 Polar 對寵物健康日常的觀察與實用提案。
        </p>
      </section>

      {/* Category Filter */}
      <div className="blog-filter">
        <div className="blog-filter__scroll" role="tablist" aria-label="文章分類">
          {BLOG_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              role="tab"
              aria-selected={activeCategory === cat.key}
              className={`blog-filter__btn ${activeCategory === cat.key ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredPosts.length > 0 ? (
        <AnimatePresence mode="wait">
          <div className="blog-grid">
            {filteredPosts.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <div className="blog-empty">
          <span className="blog-empty__icon">📭</span>
          <h3 className="blog-empty__title">此分類暫無文章</h3>
          <p className="blog-empty__desc">請稍後再來，或瀏覽其他分類</p>
        </div>
      )}

      {/* Newsletter */}
      <div className="blog-newsletter">
        <div>
          <h2 className="blog-newsletter__title">訂閱 Polar Journal</h2>
          <p className="blog-newsletter__desc">
            每月精選文章直送信箱，不錯過任何毛孩照護新知
          </p>
        </div>
        <form
          className="blog-newsletter__form"
          onSubmit={e => e.preventDefault()}
        >
          <input
            type="email"
            className="blog-newsletter__input"
            placeholder="輸入您的 Email"
            aria-label="訂閱 Email"
          />
          <button type="submit" className="blog-newsletter__btn">
            訂閱
          </button>
        </form>
      </div>
    </main>
  )
}
