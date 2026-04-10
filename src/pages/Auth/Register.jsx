import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
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
import { ROUTES } from "../../constants/routes"
import LogoImg from "../../png/LOGO.png"
import MLogoImg from "../../png/LOGO_remove_background.png"
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

const STEPS = ["基本資料", "毛孩資料", "設定密碼", "驗證信已寄出"]
const PET_WEIGHT_PATTERN = /^\d*(\.\d*)?$/

let petIdSeed = 0

const createPetId = () => `pet-${Date.now()}-${petIdSeed++}`

const defaultPet = () => ({
  id: createPetId(),
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
  return { level: 3, label: "良好" }
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

const normalizePets = (pets) =>
  pets
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

const Register = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { register, isLoading, authError, setAuthError } = useAuth()

  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [registeredEmail, setRegisteredEmail] = useState("")
  const [resendHint, setResendHint] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  const [pets, setPets] = useState([defaultPet()])
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    email: location.state?.email ?? "",
    birthday: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const todayDateStr = new Date().toISOString().split("T")[0]
  const passwordStrength = getPasswordStrength(form.password)

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
    setAuthError("")
  }

  const setPetField = (index, field, value) => {
    setPets((prev) => prev.map((pet, i) => (i === index ? { ...pet, [field]: value } : pet)))
    setErrors((prev) => ({ ...prev, [`pet_${index}_${field}`]: "" }))
  }

  const addPet = () => {
    setPets((prev) => [...prev, defaultPet()])
  }

  const removePet = (index) => {
    if (pets.length === 1) return

    setPets((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => {
      const nextErrors = { ...prev }
      Object.keys(nextErrors).forEach((key) => {
        if (key.startsWith(`pet_${index}_`)) {
          delete nextErrors[key]
        }
      })
      return nextErrors
    })
  }

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
      if (pet.petWeight && !PET_WEIGHT_PATTERN.test(pet.petWeight)) {
        nextErrors[`pet_${index}_petWeight`] = "請輸入正確數字"
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

    if (!form.agreeTerms) {
      nextErrors.agreeTerms = "請先勾選會員條款與隱私權政策。"
    }

    return nextErrors
  }

  const handleStep0Next = async () => {
    const nextErrors = validateStep0()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsCheckingEmail(true)
    setAuthError("")

    try {
      const response = await authService.checkRegisterEmail(form.email)

      if (response.status === "registered_verified") {
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: {
            email: response.email,
            message: `${response.email} 已經註冊過，請登入使用。`,
          },
        })
        return
      }

      if (response.status === "registered_unverified") {
        setRegisteredEmail(response.email)
        setResendHint(
          response.message || "此 Email 尚未完成驗證，已重新寄送驗證信，請前往信箱完成驗證。"
        )
        setStep(3)
        return
      }

      setStep(1)
    } catch (error) {
      setAuthError(error?.body?.message || error?.message || "Email 檢查失敗，請稍後再試。")
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleNext = async () => {
    if (step === 0) {
      await handleStep0Next()
      return
    }

    const nextErrors = step === 1 ? validateStep1() : {}

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
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      gender: form.gender || undefined,
      birthday: form.birthday || undefined,
      pets: normalizePets(pets),
    })

    if (!result.success) {
      return
    }

    analytics.signUp("email")
    setRegisteredEmail(result.email || form.email.trim())
    setResendHint("註冊完成，請前往信箱點擊驗證連結後再登入。")
    setStep(3)
  }

  const handleResendVerification = async () => {
    if (!registeredEmail) return

    setIsResending(true)
    setResendHint("")

    try {
      const response = await authService.requestEmailVerification(registeredEmail)
      setResendHint(response?.message || "驗證信已重新寄出，請前往信箱查看。")
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

  const handlePetWeightChange = (index, value) => {
    if (!PET_WEIGHT_PATTERN.test(value)) {
      setErrors((prev) => ({
        ...prev,
        [`pet_${index}_petWeight`]: "請輸入正確數字",
      }))
      return
    }

    setPetField(index, "petWeight", value)
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
          <Link to={ROUTES.HOME}>
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
            加入會員
            <br />
            Mr. Polar 毛孩俱樂部
          </h2>
          <p>
            完成註冊後即可管理毛孩資料、查詢訂單、累積會員點數，
            <br />
            也能搶先收到品牌活動與新品資訊。
          </p>
        </div>

        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Gift size={16} />
            </div>
            <span>新會員可享專屬活動與最新消息</span>
          </div>

          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Star size={16} />
            </div>
            <span>會員累積消費可解鎖更多專屬權益</span>
          </div>

          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Package size={16} />
            </div>
            <span>毛孩資料與訂單紀錄一站管理</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <Link to={ROUTES.HOME}>
              <img
                src={MLogoImg}
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
              {step === 0 && "填寫基本資料"}
              {step === 1 && "新增毛孩資料"}
              {step === 2 && "設定登入密碼"}
              {step === 3 && "驗證信已寄出"}
            </h1>

            <p>
              {step === 0 && "先完成會員基本資料，下一步會確認 Email 是否已註冊。"}
              {step === 1 && "毛孩資料為選填，可先略過，之後也能到會員中心補上。"}
              {step === 2 && "設定登入密碼後，就會寄送 Email 驗證信到你的信箱。"}
              {step === 3 && (
                <>
                  我們已將驗證信寄到 <strong>{registeredEmail}</strong>，
                  <br />
                  請前往信箱完成驗證後再登入使用。
                </>
              )}
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
                    <label htmlFor="register-name">姓名 *</label>
                    <input
                      id="register-name"
                      name="name"
                      type="text"
                      className="apple-input"
                      placeholder="請輸入真實姓名"
                      value={form.name}
                      autoComplete="name"
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
                    <label htmlFor="register-phone">手機號碼 *</label>
                    <input
                      id="register-phone"
                      name="phone"
                      type="tel"
                      className="apple-input"
                      placeholder="0912345678"
                      maxLength={10}
                      value={form.phone}
                      autoComplete="tel"
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
                  <label htmlFor="register-gender">性別 ( 選填 )</label>
                  <select
                    id="register-gender"
                    name="gender"
                    className="apple-input select-input"
                    value={form.gender}
                    onChange={(event) => setField("gender", event.target.value)}
                  >
                    <option value="undisclosed"></option>
                    <option value="male">男</option>
                    <option value="female">女</option>                    
                  </select>
                </div>

                <div className="auth-field">
                  <label htmlFor="register-email">Email *</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    className="apple-input"
                    placeholder="name@example.com"
                    value={form.email}
                    autoComplete="email"
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
                  <label htmlFor="register-birthday">生日</label>
                  <input
                    id="register-birthday"
                    name="birthday"
                    type="date"
                    className="apple-input"
                    max={todayDateStr}
                    value={form.birthday}
                    onChange={(event) => setField("birthday", event.target.value)}
                  />
                </div>

                {authError && (
                  <div className="auth-global-error">
                    <AlertCircle size={16} />
                    {authError}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-blue auth-submit-btn"
                  onClick={handleNext}
                  disabled={isCheckingEmail}
                >
                  {isCheckingEmail ? (
                    <>
                      <span className="auth-spinner" />
                      檢查 Email 中...
                    </>
                  ) : (
                    <>
                      下一步
                      <ChevronRight
                        size={16}
                        style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }}
                      />
                    </>
                  )}
                </button>

                <div className="auth-divider">或</div>

                <button
                  type="button"
                  className="auth-social-btn"
                  onClick={handleLineRegister}
                  style={{ marginBottom: 20 }}
                >
                  使用 LINE 註冊
                </button>

                <p className="auth-switch">
                  已經有帳號了嗎？<Link to={ROUTES.LOGIN}>前往登入</Link>
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
                  <div key={pet.id} className="pet-card">
                    <div className="pet-card-header">
                      <span className="pet-card-title">毛孩 {index + 1}</span>

                      {pets.length > 1 && (
                        <button
                          type="button"
                          className="pet-remove-btn"
                          onClick={() => removePet(index)}
                        >
                          <Trash2 size={15} />
                          移除
                        </button>
                      )}
                    </div>

                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label htmlFor={`pet-name-${pet.id}`}>大名</label>
                        <input
                          id={`pet-name-${pet.id}`}
                          name={`pets[${index}].petName`}
                          type="text"
                          className="apple-input"
                          placeholder="請輸入毛孩名字"
                          value={pet.petName}
                          onChange={(event) => setPetField(index, "petName", event.target.value)}
                        />
                      </div>

                      <div className="auth-field">
                        <label htmlFor={`pet-gender-${pet.id}`}>性別</label>
                        <select
                          id={`pet-gender-${pet.id}`}
                          name={`pets[${index}].petGender`}
                          className="apple-input select-input"
                          value={pet.petGender}
                          onChange={(event) => setPetField(index, "petGender", event.target.value)}
                        >
                          <option value="">請選擇</option>
                          <option value="male">男孩</option>
                          <option value="female">女孩</option>
                        </select>
                      </div>
                    </div>

                    <div className="auth-row-half">
                      <div className="auth-field">
                        <label htmlFor={`pet-type-${pet.id}`}>物種</label>
                        <select
                          id={`pet-type-${pet.id}`}
                          name={`pets[${index}].petType`}
                          className="apple-input select-input"
                          value={pet.petType}
                          onChange={(event) => setPetField(index, "petType", event.target.value)}
                        >
                          <option value="">請選擇</option>
                          <option value="cat">貓</option>
                          <option value="dog">狗</option>
                          <option value="other">其他</option>
                        </select>
                      </div>

                      <div className="auth-field">
                        <label htmlFor={`pet-breed-${pet.id}`}>品種</label>
                        <input
                          id={`pet-breed-${pet.id}`}
                          name={`pets[${index}].petBreed`}
                          type="text"
                          className="apple-input"
                          placeholder="例如：米克斯、柴犬"
                          value={pet.petBreed}
                          onChange={(event) => setPetField(index, "petBreed", event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor={`pet-weight-${pet.id}`}>體重（kg）</label>
                      <input
                        id={`pet-weight-${pet.id}`}
                        name={`pets[${index}].petWeight`}
                        type="text"
                        inputMode="decimal"
                        className="apple-input"
                        placeholder="例如：4.5"
                        value={pet.petWeight}
                        onChange={(event) => handlePetWeightChange(index, event.target.value)}
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
                        <label htmlFor={`pet-birthday-${pet.id}`}>生日</label>
                        <input
                          id={`pet-birthday-${pet.id}`}
                          name={`pets[${index}].petBirthday`}
                          type="date"
                          className="apple-input"
                          max={todayDateStr}
                          value={pet.petBirthday}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            setPetField(index, "petBirthday", nextValue)
                            if (nextValue) {
                              setPetField(index, "petAge", calculateAge(nextValue))
                            }
                          }}
                        />
                      </div>

                      <div className="auth-field">
                        <label htmlFor={`pet-age-${pet.id}`}>年齡</label>
                        <input
                          id={`pet-age-${pet.id}`}
                          name={`pets[${index}].petAge`}
                          type="text"
                          inputMode="numeric"
                          className="apple-input"
                          placeholder="例如：3"
                          value={pet.petAge}
                          onChange={(event) =>
                            setPetField(index, "petAge", event.target.value.replace(/\D/g, ""))
                          }
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

                  <button
                    type="button"
                    className="btn-blue auth-submit-btn"
                    onClick={handleNext}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    下一步
                    <ChevronRight
                      size={16}
                      style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }}
                    />
                  </button>
                </div>

                <p className="auth-switch" style={{ marginTop: 16 }}>
                  <button type="button" onClick={() => setStep(2)}>
                    略過這一步
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
                  <label htmlFor="register-password">設定密碼 *</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="apple-input"
                      placeholder="至少 8 碼，需包含英文大寫與數字"
                      value={form.password}
                      autoComplete="new-password"
                      onChange={(event) => setField("password", event.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                    >
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
                              ? `active-${
                                  level === 1 ? "weak" : level === 2 ? "medium" : "strong"
                                }`
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
                  <label htmlFor="register-confirm-password">確認密碼 *</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      className="apple-input"
                      placeholder="請再次輸入密碼"
                      value={form.confirmPassword}
                      autoComplete="new-password"
                      onChange={(event) => setField("confirmPassword", event.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirm((value) => !value)}
                    >
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
                    name="agreeTerms"
                    checked={form.agreeTerms}
                    onChange={(event) => setField("agreeTerms", event.target.checked)}
                  />
                  <label htmlFor="reg-agree">
                    我已閱讀並同意 <Link to={ROUTES.MEMBER_BENEFITS}>會員權益</Link> 與{" "}
                    <Link to={ROUTES.PRIVACY}>隱私權政策</Link> 及{" "}
                    <Link to={ROUTES.TERMS}>使用條款</Link>
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

                  <button
                    type="submit"
                    className="btn-blue auth-submit-btn"
                    disabled={isLoading}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
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
                  <h3>註冊流程已完成</h3>
                  <p>
                    驗證信已寄送至 <strong>{registeredEmail}</strong>。
                    <br />
                    完成 Email 驗證後，就可以使用此帳號登入會員中心。
                  </p>
                </div>

                <button
                  className="btn-blue auth-submit-btn"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <span className="auth-spinner" />
                      重新寄送中...
                    </>
                  ) : (
                    "重新寄送驗證信"
                  )}
                </button>

                {resendHint && (
                  <p className="auth-switch" style={{ marginBottom: 16 }}>
                    {resendHint}
                  </p>
                )}

                <p className="auth-switch">
                  <Link to={ROUTES.LOGIN} state={{ email: registeredEmail }}>
                    前往登入
                  </Link>
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
