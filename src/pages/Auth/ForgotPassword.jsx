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
    if (!email.trim()) { setError('請填寫電子郵件'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('電子郵件格式不正確'); return }
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
            <img src={LogoImg} alt="Mr. Polar" style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }} />
          </Link>
        </div>
        <div className="auth-brand-content">
          <h2>重設您的<br />帳號密碼</h2>
          <p>輸入您的電子郵件，我們將在幾分鐘內寄送密碼重設連結。</p>
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
              <img src={LogoImg} alt="Mr. Polar" style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block' }} />
            </Link>
          </div>

          {!isSent ? (
            <>
              <div className="auth-header">
                <h1>忘記密碼</h1>
                <p>輸入帳號綁定的電子郵件，我們將寄送重設連結給您。</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label htmlFor="forgot-email">電子郵件</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="apple-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                  />
                  {error && <p className="auth-field-error"><AlertCircle size={12} />{error}</p>}
                </div>

                <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading}>
                  {isLoading ? <><span className="auth-spinner" />傳送中...</> : '傳送重設連結'}
                </button>

                <p className="auth-switch">
                  <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={14} /> 返回登入
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="auth-success-box">
                <div className="success-icon">📬</div>
                <h3>連結已寄出！</h3>
                <p>我們已將密碼重設連結寄至<br /><strong>{email}</strong></p>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-gray-dark)', textAlign: 'center', marginBottom: 24 }}>
                沒有收到信？請檢查垃圾郵件，或稍後再試。
              </p>
              <button className="btn-blue auth-submit-btn" onClick={() => setIsSent(false)}>
                重新傳送
              </button>
              <p className="auth-switch">
                <Link to="/login">返回登入</Link>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword
