import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SEOHead } from '../../components/common'
import { ROUTES } from '../../constants/routes'
import './Founder.css'

const TIMELINE_ITEMS = [
  {
    year: '2020',
    emoji: '🧊',
    title: '品牌創立',
    desc: '因為自家毛孩的健康問題，創辦人開始深入研究寵物營養學，決心打造真正對毛孩有益的食品品牌。',
  },
  {
    year: '2021',
    emoji: '🔬',
    title: '配方研發',
    desc: '與獸醫師、營養師合作，歷時一年開發出第一代機能零食配方，針對腸道健康、體重管理等核心需求設計。',
  },
  {
    year: '2022',
    emoji: '🐾',
    title: '首款商品上市',
    desc: 'Mr.Polar 北極先生正式上市，獲得早期用戶的熱烈迴響，第一批 500 份在 48 小時內完售。',
  },
  {
    year: '2024',
    emoji: '✅',
    title: '通過 SGS 國際認證',
    desc: '全系列商品通過 SGS 食品安全認證，重金屬、農藥殘留、微生物檢驗全數合格，品質獲得國際認可。',
  },
  {
    year: '2026',
    emoji: '❤️',
    title: '服務 50,000+ 毛孩',
    desc: '累計服務超過五萬個毛孩家庭，持續與獸醫師合作開發新配方，為每一位毛孩的健康把關。',
  },
]

const VALUES = [
  {
    icon: '🌿',
    title: '天然優先',
    desc: '嚴格篩選原料，拒絕人工色素、防腐劑與味精，讓毛孩吃到最接近自然的食物。',
  },
  {
    icon: '🔬',
    title: '科學配方',
    desc: '每款商品都有獸醫師與營養師背書，依據不同生命階段與健康需求，精準調配每種成分比例。',
  },
  {
    icon: '🤝',
    title: '飼主共創',
    desc: '我們與數百位飼主共同測試、調整，每一次改版都來自真實的使用回饋，而非單純的市場猜測。',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
}

export default function Founder() {
  return (
    <main className="founder-page">
      <SEOHead
        title="創辦人故事"
        description="認識 Mr.Polar 北極先生的創辦人，了解品牌如何從一隻生病的毛孩，走向台灣寵物健康食品的領導品牌。"
        canonicalUrl="/founder"
      />

      {/* Hero */}
      <section className="founder-hero">
        <div className="founder-hero__image">
          <span className="founder-hero__placeholder">🐻‍❄️</span>
        </div>
        <div className="founder-hero__content">
          <p className="founder-hero__kicker">Founder Story</p>
          <h1 className="founder-hero__name">北極先生的故事</h1>
          <p className="founder-hero__title">Mr.Polar 北極先生 — 創辦團隊</p>
          <blockquote className="founder-hero__quote">
            「我們不是在賣零食，我們是在替每一位飼主，
            守護他們最重要的家人。」
          </blockquote>
        </div>
      </section>

      {/* Timeline */}
      <section className="founder-timeline">
        <div className="founder-timeline__inner">
          <div className="founder-timeline__header">
            <h2 className="founder-timeline__title">品牌成長歷程</h2>
            <p className="founder-timeline__subtitle">
              從一個問題出發，到守護五萬個毛孩家庭
            </p>
          </div>

          <div className="founder-timeline__list">
            {TIMELINE_ITEMS.map((item, i) => (
              <motion.div
                key={item.year}
                className="founder-timeline__item"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                custom={i}
              >
                <div className="founder-timeline__dot">
                  <span>{item.emoji}</span>
                </div>
                <p className="founder-timeline__year">{item.year}</p>
                <h3 className="founder-timeline__event-title">{item.title}</h3>
                <p className="founder-timeline__event-desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="founder-values">
        <div className="founder-values__inner">
          <div className="founder-values__header">
            <h2 className="founder-values__title">我們相信的事</h2>
          </div>
          <div className="founder-values__grid">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                className="founder-values__card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
              >
                <span className="founder-values__icon">{v.icon}</span>
                <h3 className="founder-values__card-title">{v.title}</h3>
                <p className="founder-values__card-desc">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="founder-cta">
        <h2 className="founder-cta__title">認識我們的商品</h2>
        <p className="founder-cta__desc">
          每一款商品背後，都有一個關於愛與科學的故事
        </p>
        <Link to={ROUTES.PRODUCTS} className="founder-cta__btn">
          探索全系列商品
        </Link>
      </section>
    </main>
  )
}
