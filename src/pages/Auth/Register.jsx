import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, ChevronRight, ChevronLeft, Gift, Star, Package } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LogoImg from '../../png/LOGO.png'
import './Auth.css'

// 密碼強度計算
const getPasswordStrength = (pwd) => {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { level: 1, label: '弱' }
  if (score <= 2) return { level: 2, label: '中' }
  return { level: 3, label: '強' }
}

const STEPS = ['基本資料', '設定密碼', '完成']

const Register = () => {
  const navigate = useNavigate()
  const { register, isLoading, authError, setAuthError } = useAuth()

  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    petName: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
    setAuthError('')
  }

  const passwordStrength = getPasswordStrength(form.password)

  const validateStep0 = () => {
    const e = {}
    if (!form.name.trim()) e.name = '請填寫姓名'
    if (!form.email.trim()) e.email = '請填寫電子郵件'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '電子郵件格式不正確'
    if (!form.phone.trim()) e.phone = '請填寫手機號碼'
    else if (!/^09\d{8}$/.test(form.phone)) e.phone = '手機號碼格式不正確（09 開頭共 10 碼）'
    return e
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.password) e.password = '請設定密碼'
    else if (form.password.length < 8) e.password = '密碼至少 8 個字元'
    if (!form.confirmPassword) e.confirmPassword = '請再次輸入密碼'
    else if (form.password !== form.confirmPassword) e.confirmPassword = '兩次輸入的密碼不一致'
    if (!form.agreeTerms) e.agreeTerms = '請勾選同意服務條款'
    return e
  }

  const handleNext = () => {
    const errs = step === 0 ? validateStep0() : validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep(s => s + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      birthday: form.birthday,
      petName: form.petName,
    })
    if (result.success) {
      setIsSuccess(true)
      setStep(2)
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className="auth-page">
      {/* ── 左側品牌面板 ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <img src={LogoImg} alt="Mr. Polar" />
        </div>
        <div className="auth-brand-content">
          <h2>加入 Polar<br />毛孩的最佳選擇</h2>
          <p>成為會員，即可享有專屬優惠、生日點數回饋，以及毛孩健康資訊推播。</p>
        </div>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Gift size={16} /></div>
            <span>新會員加入即贈 100 點</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Star size={16} /></div>
            <span>每消費 NT$10 累積 1 點</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Package size={16} /></div>
            <span>免費升級 Polar Gold 資格</span>
          </div>
        </div>
      </div>

      {/* ── 右側表單 ── */}
      <div className="auth-form-panel">
        <div className="auth-form-container">

          <div className="auth-mobile-logo">
            <Link to="/"><img src={LogoImg} alt="Polar" /></Link>
          </div>

          {/* 步驟指示器 */}
          {!isSuccess && (
            <div className="auth-steps">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`auth-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                />
              ))}
            </div>
          )}

          <div className="auth-header">
            <h1>
              {step === 0 && '建立帳號'}
              {step === 1 && '設定密碼'}
              {step === 2 && '🎉 歡迎加入！'}
            </h1>
            <p>
              {step === 0 && '填寫基本資料，幾秒鐘完成註冊'}
              {step === 1 && '設定安全密碼保護您的帳號'}
              {step === 2 && ''}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── 步驟 0：基本資料 ── */}
            {step === 0 && (
              <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="auth-row-half">
                  <div className="auth-field">
                    <label>姓名 *</label>
                    <input type="text" className="apple-input" placeholder="王小明" value={form.name} onChange={e => setField('name', e.target.value)} />
                    {errors.name && <p className="auth-field-error"><AlertCircle size={12} />{errors.name}</p>}
                  </div>
                  <div className="auth-field">
                    <label>手機號碼 *</label>
                    <input type="tel" className="apple-input" placeholder="0912345678" maxLength={10} value={form.phone} onChange={e => setField('phone', e.target.value.replace(/\D/g, ''))} />
                    {errors.phone && <p className="auth-field-error"><AlertCircle size={12} />{errors.phone}</p>}
                  </div>
                </div>

                <div className="auth-field">
                  <label>電子郵件 *</label>
                  <input type="email" className="apple-input" placeholder="name@example.com" value={form.email} onChange={e => setField('email', e.target.value)} />
                  {errors.email && <p className="auth-field-error"><AlertCircle size={12} />{errors.email}</p>}
                </div>

                <div className="auth-row-half">
                  <div className="auth-field">
                    <label>生日（選填）</label>
                    <input type="date" className="apple-input" value={form.birthday} onChange={e => setField('birthday', e.target.value)} />
                  </div>
                  <div className="auth-field">
                    <label>毛孩暱稱（選填）</label>
                    <input type="text" className="apple-input" placeholder="咪咪" value={form.petName} onChange={e => setField('petName', e.target.value)} />
                  </div>
                </div>

                <button type="button" className="btn-blue auth-submit-btn" onClick={handleNext}>
                  下一步 <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>

                <p className="auth-switch">
                  已有帳號？ <Link to="/login">直接登入</Link>
                </p>
              </motion.div>
            )}

            {/* ── 步驟 1：設定密碼 ── */}
            {step === 1 && (
              <motion.form key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} onSubmit={handleSubmit} noValidate>

                <div className="auth-field">
                  <label>設定密碼 *</label>
                  <div className="auth-password-wrapper">
                    <input type={showPassword ? 'text' : 'password'} className="apple-input" placeholder="至少 8 個字元" value={form.password} autoComplete="new-password" onChange={e => setField('password', e.target.value)} />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="password-strength">
                      {[1, 2, 3].map(level => (
                        <div key={level} className={`strength-bar ${form.password && passwordStrength.level >= level ? `active-${level === 1 ? 'weak' : level === 2 ? 'medium' : 'strong'}` : ''}`} />
                      ))}
                      <span className="strength-label">{passwordStrength.label}</span>
                    </div>
                  )}
                  {errors.password && <p className="auth-field-error"><AlertCircle size={12} />{errors.password}</p>}
                </div>

                <div className="auth-field">
                  <label>確認密碼 *</label>
                  <div className="auth-password-wrapper">
                    <input type={showConfirm ? 'text' : 'password'} className="apple-input" placeholder="再次輸入密碼" value={form.confirmPassword} autoComplete="new-password" onChange={e => setField('confirmPassword', e.target.value)} />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="auth-field-error"><AlertCircle size={12} />{errors.confirmPassword}</p>}
                </div>

                <div className="auth-terms">
                  <input type="checkbox" id="reg-agree" checked={form.agreeTerms} onChange={e => setField('agreeTerms', e.target.checked)} />
                  <label htmlFor="reg-agree">
                    我已閱讀並同意 <Link to="/faq">服務條款</Link> 及 <Link to="/faq">隱私政策</Link>，並確認年滿 18 歲。
                  </label>
                </div>
                {errors.agreeTerms && <p className="auth-field-error" style={{ marginTop: -16, marginBottom: 12 }}><AlertCircle size={12} />{errors.agreeTerms}</p>}

                {authError && (
                  <div className="auth-global-error"><AlertCircle size={16} />{authError}</div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setStep(0)} style={{ flex: '0 0 48px', padding: '16px', borderRadius: 12, border: '1.5px solid var(--color-gray-light)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-dark)', transition: 'all 0.2s' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading} style={{ flex: 1, marginBottom: 0 }}>
                    {isLoading ? <><span className="auth-spinner" />建立帳號中...</> : '完成註冊'}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── 步驟 2：完成 ── */}
            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="auth-success-box">
                  <div className="success-icon">🐾</div>
                  <h3>歡迎加入 Polar！</h3>
                  <p>帳號已建立成功，您已獲得 <strong>100 點</strong>新會員贈點。</p>
                </div>
                <button className="btn-blue auth-submit-btn" onClick={() => navigate('/account')}>
                  前往會員中心
                </button>
                <p className="auth-switch">
                  <Link to="/">先逛逛商品</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Register
