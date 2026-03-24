import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import LogoImg from '../../png/LOGO.png'
import './Auth.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('先填 Email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email 格式不太對'); return }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000)) // Mock API
    setIsLoading(false)
    setIsSent(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <Link to="/">
            <img src={LogoImg} alt="Mr.Polar 北極先生" style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }} />
          </Link>
        </div>
        <div className="auth-brand-content">
          <h2>重新設定<br />密碼</h2>
          <p>輸入你的 Email，我們寄重設連結給你。</p>
        </div>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Mail size={16} /></div>
            <span>重設連結將在 15 分鐘內失效</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div className="auth-form-container" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}>

          <div className="auth-mobile-logo">
            <Link to="/">
              <img src={LogoImg} alt="Mr.Polar 北極先生" style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block' }} />
            </Link>
          </div>

          {!isSent ? (
            <>
              <div className="auth-header">
                <h1>重新設定密碼</h1>
                <p>輸入你的 Email，我們寄重設連結給你。</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="apple-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                  />
                  {error && <p className="auth-field-error"><AlertCircle size={12} />{error}</p>}
                </div>

                <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading}>
                  {isLoading ? <><span className="auth-spinner" />寄送中…</> : '寄給我'}
                </button>

                <p className="auth-switch">
                  <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={14} /> ← 回到登入
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="auth-success-box">
                <div className="success-icon">📬</div>
                <h3>寄出去了</h3>
                <p>確認一下你的信箱，找到重設連結後按下去就好。<br />沒收到的話，記得看看垃圾郵件。</p>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-gray-dark)', textAlign: 'center', marginBottom: 24 }}>
                如果還是沒看到，再寄一次就好。
              </p>
              <button className="btn-blue auth-submit-btn" onClick={() => setIsSent(false)}>
                再寄一次
              </button>
              <p className="auth-switch">
                <Link to="/login">← 回到登入</Link>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword
