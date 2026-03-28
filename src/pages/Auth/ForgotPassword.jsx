import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Mail, ArrowLeft, Clock } from 'lucide-react'
import LogoImg from '../../png/LOGO.png'
import './Auth.css'

const COOLDOWN_SECONDS = 60      // 重寄冷卻秒數
const MAX_DAILY_SENDS = 3        // 每日最多寄送次數
const STORAGE_KEY = 'fp_send_log' // localStorage key

function getTodayKey() {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

function getSendLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function recordSend() {
  const log = getSendLog()
  const today = getTodayKey()
  const count = (log[today] || 0) + 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ [today]: count }))
  return count
}

function getTodayCount() {
  const log = getSendLog()
  return log[getTodayKey()] || 0
}

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)       // 剩餘秒數
  const [dailyCount, setDailyCount] = useState(getTodayCount)
  const timerRef = useRef(null)

  // 倒數計時
  useEffect(() => {
    if (cooldown <= 0) return
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [cooldown])

  const isBlocked = dailyCount >= MAX_DAILY_SENDS
  const canResend = !isBlocked && cooldown === 0 && !isLoading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('請輸入電子郵件'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('請輸入有效的電子郵件格式'); return }
    if (isBlocked) return

    setIsLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 1000)) // TODO: 替換為 authService.forgotPassword(email)
    setIsLoading(false)

    const count = recordSend()
    setDailyCount(count)
    setIsSent(true)
    setCooldown(COOLDOWN_SECONDS)
  }

  const handleResend = async () => {
    if (!canResend) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000)) // TODO: 替換為 authService.forgotPassword(email)
    setIsLoading(false)

    const count = recordSend()
    setDailyCount(count)
    setCooldown(COOLDOWN_SECONDS)
  }

  const pad = n => String(n).padStart(2, '0')

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <Link to="/">
            <img src={LogoImg} alt="Mr.Polar" style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }} />
          </Link>
        </div>
        <div className="auth-brand-content">
          <h2>忘記密碼？<br />我們幫您找回</h2>
          <p>輸入您的 Email，我們將發送重設連結至您的信箱</p>
        </div>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Mail size={16} /></div>
            <span>重設連結有效期限為 15 分鐘</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div className="auth-form-container"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="auth-mobile-logo">
            <Link to="/"><img src={LogoImg} alt="Mr.Polar" style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block' }} /></Link>
          </div>

          {!isSent ? (
            <>
              <div className="auth-header">
                <h1>忘記密碼</h1>
                <p>輸入您的電子郵件，我們將發送重設連結</p>
              </div>
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label htmlFor="forgot-email">電子郵件</label>
                  <input
                    id="forgot-email" type="email" className="apple-input"
                    placeholder="yourname@example.com" value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                  />
                  {error && <p className="auth-field-error"><AlertCircle size={12} />{error}</p>}
                </div>
                <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading}>
                  {isLoading ? <span className="auth-spinner" /> : '發送重設連結'}
                </button>
                <p className="auth-switch">
                  <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={14} />返回登入
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="auth-success-box">
                <div className="success-icon">📧</div>
                <h3>已發送重設連結</h3>
                <p>請檢查 <strong>{email}</strong><br />的信箱，點擊連結後即可重設密碼</p>
              </div>

              {/* 每日上限提示 */}
              {isBlocked && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} />今日已達寄送上限（{MAX_DAILY_SENDS} 次），請明天再試
                </div>
              )}

              {/* 倒數 / 重寄按鈕 */}
              {!isBlocked && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {cooldown > 0 ? (
                    <p style={{ fontSize: 13, color: '#6e6e73', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Clock size={14} />
                      重新發送（{pad(Math.floor(cooldown / 60))}:{pad(cooldown % 60)}）
                    </p>
                  ) : (
                    <button
                      className="btn-blue auth-submit-btn"
                      style={{ marginBottom: 0 }}
                      onClick={handleResend}
                      disabled={!canResend}
                    >
                      {isLoading ? <span className="auth-spinner" /> : '再次寄送'}
                    </button>
                  )}
                </div>
              )}

              <p style={{ fontSize: 13, color: '#6e6e73', textAlign: 'center', marginBottom: 24 }}>
                今日已發送 {dailyCount} / {MAX_DAILY_SENDS} 次
              </p>

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
