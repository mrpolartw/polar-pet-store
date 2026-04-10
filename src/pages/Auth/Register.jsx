import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion as Motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Gift,
  Package,
  Plus,
  Star,
  Trash2,
} from "lucide-react"

import { useAuth } from "../../context/useAuth"
import authService from "../../services/authService"
import LogoImg from "../../png/LOGO.png"
import "./Auth.css"
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from "../../utils/validators"
import analytics from "../../utils/analytics"

const motion = Motion

const STEPS = ["基本資料", "毛孩資料", "設定密碼", "完成註冊"]

const defaultPet = () => ({
  petName: "",
  petAge: "",
  petType: "",
  petBreed: "",
  petWeight: "",
  petBirthday: "",
  petGender: "",
})

const getPasswordStrength = (password) => {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  if (score <= 1) return { level: 1, label: "偏弱" }
  if (score <= 2) return { level: 2, label: "中等" }
  return { level: 3, label: "安全" }
}

const calculateAge = (birthdayString) => {
  if (!birthdayString) return ""
  const today = new Date()
  const birthDate = new Date(birthdayString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age >= 0 ? String(age) : "0"
}

function normalizePets(pets) {
  return pets
    .filter((pet) => pet.petName.trim())
    .map((pet) => {
      const metadata = {}

      if (pet.petAge) metadata.age = Number(pet.petAge)
      if (pet.petWeight) metadata.weight = Number(pet.petWeight)

      return {
        name: pet.petName.trim(),
        species: pet.petType || undefined,
        breed: pet.petBreed.trim() || undefined,
        birthday: pet.petBirthday || undefined,
        gender: pet.petGender || undefined,
        metadata: Object.keys(metadata).length ? metadata : undefined,
      }
    })
}

const Register = () => {
  const location = useLocation()
  const { register, isLoading, authError, setAuthError } = useAuth()

  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [resendHint, setResendHint] = useState("")
  const [isResending, setIsResending] = useState(false)

  const [pets, setPets] = useState([defaultPet()])
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "undisclosed",
    email: location.state?.email ?? "",
    birthday: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const todayDateStr = new Date().toISOString().split("T")[0]

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
    setAuthError("")
  }

  const setPetField = (index, field, value) => {
    setPets((prev) => prev.map((pet, i) => (i === index ? { ...pet, [field]: value } : pet)))
    setErrors((prev) => ({ ...prev, [`pet_${index}_${field}`]: "" }))
  }

  const addPet = () => setPets((prev) => [...prev, defaultPet()])

  const removePet = (index) => {
    if (pets.length === 1) return
    setPets((prev) => prev.filter((_, i) => i !== index))
  }

  const passwordStrength = getPasswordStrength(form.password)

  const validateStep0 = () => {
    const nextErrors = {}
    const nameError = validateName(form.name)
    if (nameError) nextErrors.name = nameError
    const emailError = validateEmail(form.email)
    if (emailError) nextErrors.email = emailError
    const phoneError = validatePhone(form.phone)
    if (phoneError) nextErrors.phone = phoneError
    return nextErrors
  }

  const validateStep1 = () => {
    const nextErrors = {}
    pets.forEach((pet, index) => {
      if (pet.petWeight && Number.isNaN(Number(pet.petWeight))) {
        nextErrors[`pet_${index}_petWeight`] = "體重格式不正確"
      }
    })
    return nextErrors
  }

  const validateStep2 = () => {
    const nextErrors = {}
    const passwordError = validatePassword(form.password)
    if (passwordError) nextErrors.password = passwordError
    const confirmError = validatePasswordConfirm(form.password, form.confirmPassword)
    if (confirmError) nextErrors.confirmPassword = confirmError
    if (!form.agreeTerms) nextErrors.agreeTerms = "請先同意服務條款與隱私權政策"
    return nextErrors
  }

  const handleNext = () => {
    const nextErrors = step === 0 ? validateStep0() : step === 1 ? validateStep1() : {}
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setStep((value) => value + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateStep2()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const result = await register({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      gender: form.gender || "undisclosed",
      birthday: form.birthday || undefined,
      pets: normalizePets(pets),
    })

    if (!result.success) {
      return
    }

    analytics.signUp("email")
    setRegisteredEmail(result.email || form.email)
    setStep(3)
  }

  const handleResendVerification = async () => {
    if (!registeredEmail) return

    setIsResending(true)
    setResendHint("")

    try {
      const response = await authService.requestEmailVerification(registeredEmail)
      setResendHint(response?.message || "驗證信已重新寄出，請前往信箱確認。")
    } catch (error) {
      setResendHint(
        error?.body?.message || error?.message || "重新寄送驗證信失敗，請稍後再試。"
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleLineRegister = () => {
    const redirectTo = `${window.location.origin}/polar-pet-store/account`
    window.location.assign(authService.getLineLoginUrl(redirectTo))
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <Link to="/">
            <img
              src={LogoImg}
              alt="Mr. Polar"
              style={{
                height: "auto",
                width: 293,
                maxWidth: "100%",
                display: "block",
                borderRadius: 14,
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              }}
            />
          </Link>
        </div>
        <div className="auth-brand-content">
          <h2>
            加入 Mr. Polar
            <br />
            會員計畫
          </h2>
          <p>完成註冊後，我們會寄送 Email 驗證信。驗證完成後即可登入會員中心。</p>
        </div>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Gift size={16} />
            </div>
            <span>同步掌握會員點數與專屬優惠</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Star size={16} />
            </div>
            <span>建立毛孩資料，享受更完整的會員體驗</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Package size={16} />
            </div>
            <span>快速查看歷史訂單與配送資訊</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <Link to="/">
              <img
                src={LogoImg}
                alt="Mr. Polar"
                style={{ height: "auto", width: 293, maxWidth: "100%", display: "block" }}
              />
            </Link>
          </div>

          {step < 3 && (
            <div className="auth-steps">
              {STEPS.slice(0, 3).map((label, index) => (
                <div key={label} className="auth-step-item">
                  <div
                    className={`auth-step-dot ${index === step ? "active" : ""} ${
                      index < step ? "done" : ""
                    }`}
                  />
                  <span className={`auth-step-label ${index === step ? "active" : ""}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="auth-header">
            <h1>
              {step === 0 && "建立會員帳號"}
              {step === 1 && "毛孩資料"}
              {step === 2 && "設定密碼"}
              {step === 3 && "驗證信已寄出"}
            </h1>
            <p>
              {step === 0 && "請先填寫你的基本資料。"}
              {step === 1 && "可先補上毛孩資料，也可以稍後在會員中心再新增。"}
              {step === 2 && "設定安全密碼，完成後我們會寄送 Email 驗證信。"}
              {step === 3 && "請前往信箱點擊驗證連結，完成驗證後即可登入。"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="auth-row-half">
                  <div className="auth-field">
                    <label>姓名 *</label>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="請輸入姓名"
                      value={form.name}
                      onChange={(event) => setField("name", event.target.value)}
                    />
                    {errors.name && (
                      <p className="auth-field-error">
                        <AlertCircle size={12} />
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="auth-field">
                    <label>手機號碼 *</label>
                    <input
                      type="tel"
                      className="apple-input"
                      placeholder="0912345678"
                      maxLength={10}
                      value={form.phone}
                      onChange={(event) =>
                        setField("phone", event.target.value.replace(/\D/g, ""))
                      }
                    />
                    {errors.phone && (
                      <p className="auth-field-error">
                        <AlertCircle size={12} />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="auth-field">
                  <label>性別</label>
                  <select
                    className="apple-input select-input"
                    value={form.gender}
                    onChange={(event) => setField("gender", event.target.value)}
                  >
                    <option value="undisclosed">不透露</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>

                <div className="auth-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="apple-input"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(event) => setField("email", event.target.value)}
                  />
                  {errors.email && (
                    <p className="auth-field-error">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="auth-field">
                  <label>生日</label>
                  <input
                    type="date"
                    className="apple-input"
                    max={todayDateStr}
                    value={form.birthday}
                    onChange={(event) => setField("birthday", event.target.value)}
                  />
                </div>

                <button type="button" className="btn-blue auth-submit-btn" onClick={handleNext}>
                  下一步
                  <ChevronRight size={16} style={{ display: "inline", verticalAlign: "middle" }} />
                </button>

                <div className="auth-divider">或</div>
                <button
                  type="button"
                  className="auth-social-btn"
                  onClick={handleLineRegister}
                  style={{ marginBottom: 20 }}
                >
                  使用 LINE 註冊 / 登入
                </button>
                <p className="auth-switch">
                  已經有帳號了？ <Link to="/login">立即登入</Link>
                </p>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {pets.map((pet, index) => (
                  <div key={`${index}-${pet.petName}`} className="pet-card">
                    <div className="pet-card-header">
                      <span className="pet-card-title">毛孩 {index + 1}</span>
                      {pets.length > 1 && (
                        <button type="button" className="pet-remove-btn" onClick={() => removePet(index)}>
                          <Trash2 size={15} />
                          移除
                        </button>
                      )}
                    </div>

                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label>毛孩姓名</label>
                        <input
                          type="text"
                          className="apple-input"
                          placeholder="請輸入毛孩姓名"
                          value={pet.petName}
                          onChange={(event) => setPetField(index, "petName", event.target.value)}
                        />
                      </div>
                      <div className="auth-field">
                        <label>性別</label>
                        <select
                          className="apple-input select-input"
                          value={pet.petGender}
                          onChange={(event) => setPetField(index, "petGender", event.target.value)}
                        >
                          <option value="">未選擇</option>
                          <option value="male">公</option>
                          <option value="female">母</option>
                          <option value="unknown">不明</option>
                        </select>
                      </div>
                    </div>

                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label>物種</label>
                        <select
                          className="apple-input select-input"
                          value={pet.petType}
                          onChange={(event) => setPetField(index, "petType", event.target.value)}
                        >
                          <option value="">未選擇</option>
                          <option value="cat">貓</option>
                          <option value="dog">狗</option>
                          <option value="bird">鳥</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div className="auth-field">
                        <label>品種</label>
                        <input
                          type="text"
                          className="apple-input"
                          placeholder="請輸入品種"
                          value={pet.petBreed}
                          onChange={(event) => setPetField(index, "petBreed", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label>體重（kg）</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="apple-input"
                        placeholder="例如 4.5"
                        value={pet.petWeight}
                        onChange={(event) => {
                          let nextValue = event.target.value.replace(/[^\d.]/g, "")
                          const parts = nextValue.split(".")
                          if (parts.length > 2) nextValue = `${parts[0]}.${parts.slice(1).join("")}`
                          setPetField(index, "petWeight", nextValue)
                        }}
                      />
                      {errors[`pet_${index}_petWeight`] && (
                        <p className="auth-field-error">
                          <AlertCircle size={12} />
                          {errors[`pet_${index}_petWeight`]}
                        </p>
                      )}
                    </div>

                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label>生日</label>
                        <input
                          type="date"
                          className="apple-input"
                          max={todayDateStr}
                          value={pet.petBirthday}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            setPetField(index, "petBirthday", nextValue)
                            if (nextValue) setPetField(index, "petAge", calculateAge(nextValue))
                          }}
                        />
                      </div>
                      <div className="auth-field">
                        <label>年齡</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="apple-input"
                          placeholder="歲"
                          value={pet.petAge}
                          onChange={(event) => {
                            setPetField(index, "petAge", event.target.value.replace(/\D/g, ""))
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" className="pet-add-btn" onClick={addPet}>
                  <Plus size={16} />
                  新增毛孩
                </button>

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    style={{
                      flex: "0 0 48px",
                      padding: "16px",
                      borderRadius: 12,
                      border: "1.5px solid var(--color-gray-light)",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-gray-dark)",
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" className="btn-blue auth-submit-btn" onClick={handleNext} style={{ flex: 1, marginBottom: 0 }}>
                    下一步
                    <ChevronRight size={16} style={{ display: "inline", verticalAlign: "middle" }} />
                  </button>
                </div>

                <p className="auth-switch" style={{ marginTop: 16 }}>
                  <button type="button" onClick={() => setStep(2)}>
                    先略過這一步
                  </button>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="auth-field">
                  <label>設定密碼 *</label>
                  <div className="auth-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="apple-input"
                      placeholder="至少 8 碼"
                      value={form.password}
                      autoComplete="new-password"
                      onChange={(event) => setField("password", event.target.value)}
                    />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="password-strength">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`strength-bar ${
                            passwordStrength.level >= level
                              ? `active-${level === 1 ? "weak" : level === 2 ? "medium" : "strong"}`
                              : ""
                          }`}
                        />
                      ))}
                      <span className="strength-label">{passwordStrength.label}</span>
                    </div>
                  )}
                  {errors.password && (
                    <p className="auth-field-error">
                      <AlertCircle size={12} />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="auth-field">
                  <label>確認密碼 *</label>
                  <div className="auth-password-wrapper">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="apple-input"
                      placeholder="請再次輸入密碼"
                      value={form.confirmPassword}
                      autoComplete="new-password"
                      onChange={(event) => setField("confirmPassword", event.target.value)}
                    />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowConfirm((value) => !value)}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="auth-field-error">
                      <AlertCircle size={12} />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="auth-terms">
                  <input
                    type="checkbox"
                    id="reg-agree"
                    checked={form.agreeTerms}
                    onChange={(event) => setField("agreeTerms", event.target.checked)}
                  />
                  <label htmlFor="reg-agree">
                    我已閱讀並同意 <Link to="/terms">服務條款</Link> 與 <Link to="/privacy">隱私權政策</Link>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="auth-field-error" style={{ marginTop: -16, marginBottom: 12 }}>
                    <AlertCircle size={12} />
                    {errors.agreeTerms}
                  </p>
                )}

                {authError && (
                  <div className="auth-global-error">
                    <AlertCircle size={16} />
                    {authError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: "0 0 48px",
                      padding: "16px",
                      borderRadius: 12,
                      border: "1.5px solid var(--color-gray-light)",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-gray-dark)",
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading} style={{ flex: 1, marginBottom: 0 }}>
                    {isLoading ? (
                      <>
                        <span className="auth-spinner" />
                        註冊中...
                      </>
                    ) : (
                      "完成註冊"
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="auth-success-box">
                  <div className="success-icon">✓</div>
                  <h3>驗證信已寄出</h3>
                  <p>
                    我們已將驗證信寄到 <strong>{registeredEmail}</strong>。
                    <br />
                    請點擊信中的驗證連結，完成後即可登入會員中心。
                  </p>
                </div>

                <button className="btn-blue auth-submit-btn" onClick={handleResendVerification} disabled={isResending}>
                  {isResending ? (
                    <>
                      <span className="auth-spinner" />
                      重新寄送中...
                    </>
                  ) : (
                    "重新寄送驗證信"
                  )}
                </button>
                {resendHint && <p className="auth-switch" style={{ marginBottom: 16 }}>{resendHint}</p>}
                <p className="auth-switch">
                  <Link to="/login">前往登入</Link>
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
