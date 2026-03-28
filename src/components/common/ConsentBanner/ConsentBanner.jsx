import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { storage } from '../../../utils/storage'
import { analytics } from '../../../utils/analytics'
import { CONFIG } from '../../../constants/config'
import './ConsentBanner.css'

function buildConsent(analytics, marketing) {
  return {
    necessary: true,
    analytics,
    marketing,
    acceptedAt: new Date().toISOString(),
  }
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(() => {
    const saved = storage.get(CONFIG.COOKIE_CONSENT_KEY)
    return !saved
  })

  const save = (consent) => {
    storage.set(CONFIG.COOKIE_CONSENT_KEY, consent)
    setVisible(false)
    if (consent.analytics) {
      analytics.init()
    }
  }

  const handleAcceptAll = () => save(buildConsent(true, true))
  const handleNecessaryOnly = () => save(buildConsent(false, false))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="cookie-banner"
          role="region"
          aria-label="Cookie 使用說明"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{    y: 80, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <div className="cookie-banner__inner">
            <p className="cookie-banner__text">
              我們使用 Cookie 提升您的瀏覽體驗及分析網站流量。
              繼續使用即表示您同意我們的{' '}
              <Link to="/privacy">隱私政策</Link>。
            </p>
            <div className="cookie-banner__actions">
              <button
                className="cookie-btn cookie-btn--outline"
                onClick={handleNecessaryOnly}
              >
                僅必要
              </button>
              <button
                className="cookie-btn cookie-btn--primary"
                onClick={handleAcceptAll}
              >
                接受全部
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
