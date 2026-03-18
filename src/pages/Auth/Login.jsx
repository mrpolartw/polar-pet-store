import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Package, Star, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/useAuth'

// 桌面版：LOGO.png（含淺色背景）
import LogoDesktop from '../../png/LOGO.png'
// 手機版：LOGO去背景.png（透明底，在淺色頁面直接顯示原色）
import LogoMobile from '../../png/LOGO去背景.png'

import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, authError, setAuthError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})

  const from = location.state?.from || '/account'

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = '請填寫電子郵件'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '電子郵件格式不正確'
    if (!password) e.password = '請填寫密碼'
    else if (password.length < 6) e.password = '密碼至少 6 個字元'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const result = await login(email, password)
    if (result.success) navigate(from, { replace: true })
  }

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  }

  return (
    <div className="auth-page">

      {/* ══════════════════════════════════
          左側品牌面板（桌面版）
          使用 LOGO.png（含淺色背景），
          圓角卡片樣式讓它自然嵌入深色面板
      ══════════════════════════════════ */}
      <div className="auth-brand-panel">

        {/* 桌面 Logo：直接顯示 LOGO.png，不加 filter */}
        <div className="auth-brand-logo">
          <Link to="/">
            <img
              src={LogoDesktop}
              alt="Mr. Polar"
              style={{
                height: 'auto',
                width: 293,          /* 固定寬度，高度等比縮放 */
                maxWidth: '100%',
                display: 'block',
                borderRadius: 14,    /* 圓角讓方形背景變成卡片 */
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',  /* 輕微陰影增加浮起感 */
              }}
            />
          </Link>
        </div>

        <div className="auth-brand-content">
          <h2>歡迎回到<br />Polar 的世界</h2>
          <p>登入後享有完整購物體驗，輕鬆管理訂單與收藏您心愛的毛孩食品。</p>
        </div>

        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Package size={16} /></div>
            <span>即時追蹤所有訂單狀態</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Star size={16} /></div>
            <span>累積點數兌換專屬優惠</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><ShieldCheck size={16} /></div>
            <span>個人資料受 256-bit 加密保護</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          右側表單區域
      ══════════════════════════════════ */}
      <div className="auth-form-panel">
        <motion.div className="auth-form-container" {...fadeUp}>

          {/* 手機版 Logo：透明底，原色顯示 */}
          <div className="auth-mobile-logo">
            <Link to="/">
              <img
                src={LogoMobile}
                alt="Polar"
                style={{
                  height: 'auto',
                  width: 293,
                  maxWidth: '100%',
                  display: 'block',
                }}
              />
            </Link>
          </div>

          {/* 表單標題 */}
          <div className="auth-header">
            <h1>登入會員</h1>
            <p>輸入您的帳號密碼以繼續</p>
          </div>

          {/* 全域錯誤訊息 */}
          {authError && (
            <motion.div
              className="auth-global-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} />
              {authError}
            </motion.div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* 電子郵件 */}
            <div className="auth-field">
              <label htmlFor="login-email">電子郵件</label>
              <input
                id="login-email"
                type="email"
                className="apple-input"
                placeholder="name@example.com"
                value={email}
                autoComplete="email"
                onChange={e => {
                  setEmail(e.target.value)
                  setErrors(p => ({ ...p, email: '' }))
                }}
              />
              {errors.email && (
                <p className="auth-field-error">
                  <AlertCircle size={12} />{errors.email}
                </p>
              )}
            </div>

            {/* 密碼 */}
            <div className="auth-field">
              <label htmlFor="login-password">密碼</label>
              <div className="auth-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="apple-input"
                  placeholder="請輸入密碼"
                  value={password}
                  autoComplete="current-password"
                  onChange={e => {
                    setPassword(e.target.value)
                    setErrors(p => ({ ...p, password: '' }))
                  }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="auth-field-error">
                  <AlertCircle size={12} />{errors.password}
                </p>
              )}
            </div>

            {/* 記住我 + 忘記密碼 */}
            <div className="auth-options-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                記住我
              </label>
              <Link to="/forgot-password" className="auth-forgot-link">忘記密碼？</Link>
            </div>

            {/* 登入按鈕 */}
            <button
              type="submit"
              className="btn-blue auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading
                ? <><span className="auth-spinner" />登入中...</>
                : '登入'
              }
            </button>

            {/* 分隔線 */}
            <div className="auth-divider">或</div>

            {/* LINE 登入 */}
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => alert('LINE 登入功能開發中')}
              style={{ marginBottom: 10 }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#06C755">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              使用 LINE 繼續登入
            </button>

            {/* Google 登入 */}
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => alert('Google 登入功能開發中')}
              style={{ marginBottom: 24 }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              使用 Google 繼續登入
            </button>

            {/* 切換到註冊 */}
            <p className="auth-switch">
              還沒有帳號？{' '}
              <Link to="/register">立即加入 Polar 會員</Link>
            </p>

          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
