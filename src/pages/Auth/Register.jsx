import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, ChevronRight, ChevronLeft, Gift, Star, Package, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LogoImg from '../../png/LOGO.png'
import './Auth.css'

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

const STEPS = ['基本資料', '毛孩資料', '設定密碼', '完成']

// 單隻毛孩的預設空白資料
const defaultPet = () => ({
  petName: '',
  petAge: '',
  petType: '',
  petBreed: '',
  petWeight: '',
  petBirthday: '',
  petGender: '',
})

const Register = () => {
  const navigate = useNavigate()
  const { register, isLoading, authError, setAuthError } = useAuth()

  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})

  // 多隻毛孩陣列
  const [pets, setPets] = useState([defaultPet()])

  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: '',
    email: '',
    birthday: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
    setAuthError('')
  }

  // 更新指定 index 的毛孩欄位
  const setPetField = (index, field, value) => {
    setPets(prev => prev.map((pet, i) => i === index ? { ...pet, [field]: value } : pet))
    setErrors(p => ({ ...p, [`pet_${index}_${field}`]: '' }))
  }

  // 新增一隻毛孩
  const addPet = () => setPets(prev => [...prev, defaultPet()])

  // 刪除指定 index 的毛孩（至少保留 1 隻）
  const removePet = (index) => {
    if (pets.length === 1) return
    setPets(prev => prev.filter((_, i) => i !== index))
  }

  const passwordStrength = getPasswordStrength(form.password)

  const validateStep0 = () => {
    const e = {}
    if (!form.name.trim()) e.name = '請填寫姓名'
    if (!form.phone.trim()) e.phone = '請填寫手機號碼'
    else if (!/^09\d{8}$/.test(form.phone)) e.phone = '手機號碼格式不正確（09 開頭共 10 碼）'
    if (!form.email.trim()) e.email = '請填寫電子郵件'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '電子郵件格式不正確'
    return e
  }

  const validateStep1 = () => {
    const e = {}
    pets.forEach((pet, i) => {
      if (pet.petWeight && isNaN(Number(pet.petWeight))) {
        e[`pet_${i}_petWeight`] = '請輸入數字（例如：3.5）'
      }
    })
    return e
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.password) e.password = '請設定密碼'
    else if (form.password.length < 8) e.password = '密碼至少 8 個字元'
    if (!form.confirmPassword) e.confirmPassword = '請再次輸入密碼'
    else if (form.password !== form.confirmPassword) e.confirmPassword = '兩次輸入的密碼不一致'
    if (!form.agreeTerms) e.agreeTerms = '請勾選同意服務條款'
    return e
  }

  const handleNext = () => {
    const errs = step === 0 ? validateStep0() : step === 1 ? validateStep1() : {}
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep(s => s + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateStep2()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const result = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      birthday: form.birthday,
      pets,
    })
    if (result.success) setStep(3)
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
          <img src={LogoImg} alt="Mr. Polar" style={{ width: 200, height: 'auto', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }} />
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
          {step < 3 && (
            <div className="auth-steps">
              {STEPS.slice(0, 3).map((label, i) => (
                <div key={i} className="auth-step-item">
                  <div className={`auth-step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
                  <span className={`auth-step-label ${i === step ? 'active' : ''}`}>{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="auth-header">
            <h1>
              {step === 0 && '建立帳號'}
              {step === 1 && '毛孩資料'}
              {step === 2 && '設定密碼'}
              {step === 3 && '🎉 歡迎加入！'}
            </h1>
            <p>
              {step === 0 && '填寫基本資料，幾秒鐘完成註冊'}
              {step === 1 && '填寫毛孩資訊，獲得優惠（選填）'}
              {step === 2 && '設定安全密碼保護您的帳號'}
            </p>
          </div>

          <AnimatePresence mode="wait">

            {/* ══════════════════════════
                Step 0：基本資料
            ══════════════════════════ */}
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
                  <label>性別（選填）</label>
                  <select className="apple-input select-input" value={form.gender} onChange={e => setField('gender', e.target.value)}>
                    <option value="">請選擇</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">不願透露</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label>電子郵件 *</label>
                  <input type="email" className="apple-input" placeholder="name@example.com" value={form.email} onChange={e => setField('email', e.target.value)} />
                  {errors.email && <p className="auth-field-error"><AlertCircle size={12} />{errors.email}</p>}
                </div>

                <div className="auth-field">
                  <label>生日（選填）</label>
                  <input type="date" className="apple-input" value={form.birthday} onChange={e => setField('birthday', e.target.value)} />
                </div>

                <button type="button" className="btn-blue auth-submit-btn" onClick={handleNext}>
                  下一步 <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
                <p className="auth-switch">已有帳號？ <Link to="/login">直接登入</Link></p>
              </motion.div>
            )}

            {/* ══════════════════════════
                Step 1：毛孩資料（多隻）
            ══════════════════════════ */}
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>

                {pets.map((pet, index) => (
                  <div key={index} className="pet-card">

                    {/* 毛孩卡片標題 */}
                    <div className="pet-card-header">
                      <span className="pet-card-title">🐾 毛孩 {index + 1}</span>
                      {pets.length > 1 && (
                        <button type="button" className="pet-remove-btn" onClick={() => removePet(index)}>
                          <Trash2 size={15} />
                          移除
                        </button>
                      )}
                    </div>

                    {/* 毛孩姓名 + 性別 */}
                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label>毛孩姓名</label>
                        <input type="text" className="apple-input" placeholder="咪咪" value={pet.petName} onChange={e => setPetField(index, 'petName', e.target.value)} />
                      </div>
                      <div className="auth-field">
                        <label>性別</label>
                        <select className="apple-input select-input" value={pet.petGender} onChange={e => setPetField(index, 'petGender', e.target.value)}>
                          <option value="">請選擇</option>
                          <option value="male">男生</option>
                          <option value="female">女生</option>
                        </select>
                      </div>
                    </div>

                    {/* 種類 + 品種 */}
                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label>種類</label>
                        <select className="apple-input select-input" value={pet.petType} onChange={e => setPetField(index, 'petType', e.target.value)}>
                          <option value="">請選擇</option>
                          <option value="cat">貓咪</option>
                          <option value="dog">狗狗</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div className="auth-field">
                        <label>品種</label>
                        <input type="text" className="apple-input" placeholder="例如：柴犬、英短" value={pet.petBreed} onChange={e => setPetField(index, 'petBreed', e.target.value)} />
                      </div>
                    </div>

                    {/* 年齡 + 體重 */}
                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label>年齡（歲）</label>
                        <input type="number" className="apple-input" placeholder="3" min={0} max={30} value={pet.petAge} onChange={e => setPetField(index, 'petAge', e.target.value)} />
                      </div>
                      <div className="auth-field">
                        <label>體重（kg）</label>
                        <input type="text" className="apple-input" placeholder="例如：3.5" value={pet.petWeight} onChange={e => setPetField(index, 'petWeight', e.target.value)} />
                        {errors[`pet_${index}_petWeight`] && (
                          <p className="auth-field-error"><AlertCircle size={12} />{errors[`pet_${index}_petWeight`]}</p>
                        )}
                      </div>
                    </div>

                    {/* 毛孩生日 */}
                    <div className="auth-field">
                      <label>毛孩生日</label>
                      <input type="date" className="apple-input" value={pet.petBirthday} onChange={e => setPetField(index, 'petBirthday', e.target.value)} />
                    </div>

                  </div>
                ))}

                {/* 新增毛孩按鈕 */}
                <button type="button" className="pet-add-btn" onClick={addPet}>
                  <Plus size={16} />
                  新增毛孩
                </button>

                {/* 下一步 / 上一步 */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={() => setStep(0)} style={{ flex: '0 0 48px', padding: '16px', borderRadius: 12, border: '1.5px solid var(--color-gray-light)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-dark)' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" className="btn-blue auth-submit-btn" onClick={handleNext} style={{ flex: 1, marginBottom: 0 }}>
                    下一步 <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  </button>
                </div>

                <p className="auth-switch" style={{ marginTop: 16 }}>
                  <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--color-brand-coffee)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
                    略過此步驟
                  </button>
                </p>
              </motion.div>
            )}

            {/* ══════════════════════════
                Step 2：設定密碼
            ══════════════════════════ */}
            {step === 2 && (
              <motion.form key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} onSubmit={handleSubmit} noValidate>

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
                        <div key={level} className={`strength-bar ${passwordStrength.level >= level ? `active-${level === 1 ? 'weak' : level === 2 ? 'medium' : 'strong'}` : ''}`} />
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

                {authError && <div className="auth-global-error"><AlertCircle size={16} />{authError}</div>}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setStep(1)} style={{ flex: '0 0 48px', padding: '16px', borderRadius: 12, border: '1.5px solid var(--color-gray-light)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-dark)' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading} style={{ flex: 1, marginBottom: 0 }}>
                    {isLoading ? <><span className="auth-spinner" />建立帳號中...</> : '完成註冊'}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ══════════════════════════
                Step 3：完成
            ══════════════════════════ */}
            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="auth-success-box">
                  <div className="success-icon">🐾</div>
                  <h3>歡迎加入 Polar！</h3>
                  <p>帳號已建立成功，您已獲得 <strong>100 點</strong>新會員贈點。</p>
                </div>
                <button className="btn-blue auth-submit-btn" onClick={() => navigate('/account')}>
                  前往會員中心
                </button>
                <p className="auth-switch"><Link to="/">先逛逛商品</Link></p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Register
