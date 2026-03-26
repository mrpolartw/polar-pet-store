import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { SEOHead } from '../../components/common'
import { ROUTES } from '../../constants/routes'
import './QualityAssurance.css'

const CERTS = [
  {
    badge: '🏅',
    name: 'SGS 國際認證',
    desc: '重金屬、農藥殘留、微生物全項目檢驗合格',
  },
  {
    badge: '✅',
    name: 'HACCP 認證',
    desc: '危害分析關鍵控制點，確保生產全流程安全無虞',
  },
  {
    badge: '🏭',
    name: 'GMP 優良製造',
    desc: '符合食品良好製造規範，生產環境定期稽核',
  },
  {
    badge: '🇹🇼',
    name: '台灣在地製造',
    desc: '原料嚴選台灣在地供應商，全程冷鏈運輸管控',
  },
]

const PROCESS_STEPS = [
  {
    icon: '🌾',
    title: '原料嚴選',
    desc: '每批原料入廠前均進行農藥與重金屬初步篩檢',
  },
  {
    icon: '⚙️',
    title: '低溫加工',
    desc: '低溫乾燥製程保留最多天然營養素與風味',
  },
  {
    icon: '🔬',
    title: 'SGS 送驗',
    desc: '每批次成品送第三方實驗室進行全項目安全檢驗',
  },
  {
    icon: '📦',
    title: '冷鏈出貨',
    desc: '全程冷鏈配送，確保商品抵達時品質如初',
  },
]

const FAQ_ITEMS = [
  {
    q: '商品有通過什麼認證？',
    a: '全系列商品均通過 SGS 國際食品安全認證，檢驗項目包含重金屬（鉛、鎘、汞）、農藥殘留、微生物（沙門氏菌、大腸桿菌）等，檢驗報告可於官網下載。',
  },
  {
    q: '原料來源是哪裡？',
    a: '主要肉類原料選用台灣本地屠宰場供應的新鮮肉品，蔬果類原料則與通過農藥殘留自主管理計畫的農場長期合作，確保來源可追溯。',
  },
  {
    q: '商品有添加防腐劑嗎？',
    a: '我們的商品採用低溫乾燥工法，利用降低水活性來延長保存期限，不添加任何人工防腐劑、人工色素及味精。',
  },
  {
    q: '適合幼犬/幼貓食用嗎？',
    a: '各商品頁面均標示適用年齡與體重範圍，建議幼犬貓（12個月以下）在獸醫師建議下使用，或選擇我們特別標示「全齡適用」的款式。',
  },
  {
    q: '保存方式與保存期限？',
    a: '未開封商品請存放於陰涼乾燥處，避免陽光直射，保存期限為 18 個月。開封後請密封冷藏，建議 30 天內食用完畢。',
  },
]

const fadeUp = {
  hidden:   { opacity: 0, y: 20 },
  visible:  (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: 'easeOut' },
  }),
}

export default function QualityAssurance() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i)

  return (
    <main className="qa-page">
      <SEOHead
        title="品質保證"
        description="Mr.Polar 北極先生全系列商品通過 SGS 國際認證，嚴格把關每一個生產環節，給毛孩最安心的選擇。"
        canonicalUrl="/quality-assurance"
      />

      {/* Hero */}
      <section className="qa-hero">
        <p className="qa-hero__kicker">Quality Assurance</p>
        <h1 className="qa-hero__title">每一口，都經過嚴格把關</h1>
        <p className="qa-hero__desc">
          從原料選擇到成品出貨，我們在每個環節設置嚴格的品質控管，
          讓您對毛孩的每一口都感到安心。
        </p>
      </section>

      {/* Certifications */}
      <section className="qa-certs">
        <div className="qa-certs__inner">
          <div className="qa-section-header">
            <h2 className="qa-section-title">國際認證一覽</h2>
            <p className="qa-section-subtitle">
              獲得多項國際食品安全認證，品質獲第三方機構獨立驗證
            </p>
          </div>
          <div className="qa-certs__grid">
            {CERTS.map((cert, i) => (
              <motion.div
                key={cert.name}
                className="qa-cert-card"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
              >
                <span className="qa-cert-card__badge">{cert.badge}</span>
                <h3 className="qa-cert-card__name">{cert.name}</h3>
                <p className="qa-cert-card__desc">{cert.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="qa-process">
        <div className="qa-process__inner">
          <div className="qa-section-header">
            <h2 className="qa-section-title">生產流程</h2>
            <p className="qa-section-subtitle">
              每一批商品都經過四道嚴格關卡才能出貨
            </p>
          </div>
          <div className="qa-process__steps">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                className="qa-process__step"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
              >
                <div className="qa-process__step-icon">{step.icon}</div>
                <h3 className="qa-process__step-title">{step.title}</h3>
                <p className="qa-process__step-desc">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="qa-faq">
        <div className="qa-faq__inner">
          <div className="qa-section-header">
            <h2 className="qa-section-title">品質常見問題</h2>
          </div>
          <div className="qa-faq__list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="qa-faq__item">
                <button
                  className="qa-faq__question"
                  onClick={() => toggle(i)}
                  aria-expanded={openIndex === i}
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    className={`qa-faq__chevron ${openIndex === i ? 'is-open' : ''}`}
                  />
                </button>
                {openIndex === i && (
                  <motion.p
                    className="qa-faq__answer"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.a}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="qa-cta">
        <h2 className="qa-cta__title">品質有保證，現在就來選購</h2>
        <p className="qa-cta__desc">
          7 天鑑賞期，不滿意全額退款
        </p>
        <Link to={ROUTES.PRODUCTS} className="btn-blue">
          探索全系列商品
        </Link>
      </section>
    </main>
  )
}
