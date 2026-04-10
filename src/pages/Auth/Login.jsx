import React, { useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle, Eye, EyeOff, Package, ShieldCheck, Star } from "lucide-react"
import { motion as Motion } from "framer-motion"

import { useAuth } from "../../context/useAuth"
import authService from "../../services/authService"
import { ROUTES } from "../../constants/routes"
import { validateEmail, validateRequired } from "../../utils/validators"
import analytics from "../../utils/analytics"
import LogoImg from "../../png/LOGO.png"
import "./Auth.css"

const motion = Motion

const LINE_ERROR_MESSAGES = {
  invalid_callback: "LINE 登入回呼資料不完整，請重新操作一次。",
  line_auth_failed: "LINE 登入失敗，請稍後再試。",
  line_unexpected_error: "LINE 登入發生未預期錯誤，請稍後再試。",
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login, isLoading, authError, setAuthError } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [verificationEmail, setVerificationEmail] = useState("")
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [verificationHint, setVerificationHint] = useState("")

  const lineErrorMessage = useMemo(() => {
    const lineError = searchParams.get("line_error")
    return lineError
      ? LINE_ERROR_MESSAGES[lineError] ?? "LINE 登入失敗，請稍後再試。"
      : ""
  }, [searchParams])

  const validate = () => {
    const nextErrors = {}
    const emailError = validateEmail(email)
    if (emailError) nextErrors.email = emailError

    const passwordError = validateRequired(password, "密碼")
    if (passwordError) nextErrors.password = passwordError

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setAuthError("")
    setVerificationHint("")
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const result = await login(email, password)

    if (!result.success) {
      setVerificationEmail(
        result.code === "EMAIL_NOT_VERIFIED" ? result.email || email : ""
      )
      return
    }

    analytics.login("email")
    const destination = location.state?.from || ROUTES.HOME
    navigate(destination, { replace: true })
  }

  const handleLineLogin = () => {
    const redirectPath = location.state?.from || ROUTES.ACCOUNT
    const redirectTo = `${window.location.origin}/polar-pet-store${redirectPath}`
    window.location.assign(authService.getLineLoginUrl(redirectTo))
  }

  const handleResendVerification = async () => {
    if (!verificationEmail) return

    setIsResendingVerification(true)
    setVerificationHint("")

    try {
      const response = await authService.requestEmailVerification(verificationEmail)
      setVerificationHint(
        response?.message || "驗證信已重新寄出，請前往信箱確認。"
      )
    } catch (error) {
      setVerificationHint(
        error?.body?.message || error?.message || "重新寄送驗證信失敗，請稍後再試。"
      )
    } finally {
      setIsResendingVerification(false)
    }
  }

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
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
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
              }}
            />
          </Link>
        </div>

        <div className="auth-brand-content">
          <h2>
            歡迎回到
            <br />
            Mr. Polar
          </h2>
          <p>使用 Email / 密碼或 LINE 登入，繼續查看你的會員資料與訂單紀錄。</p>
        </div>

        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Package size={16} />
            </div>
            <span>即時查看訂單與配送進度</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Star size={16} />
            </div>
            <span>同步掌握會員點數與專屬權益</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <ShieldCheck size={16} />
            </div>
            <span>完成 Email 驗證後即可安全登入</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div className="auth-form-container" {...fadeUp}>
          <div className="auth-mobile-logo">
            <Link to="/">
              <img
                src={LogoImg}
                alt="Mr. Polar"
                style={{
                  height: "auto",
                  width: 293,
                  maxWidth: "100%",
                  display: "block",
                }}
              />
            </Link>
          </div>

          <div className="auth-header">
            <h1>登入會員</h1>
            <p>使用 Email / 密碼登入，或以 LINE 快速登入。</p>
          </div>

          {(authError || lineErrorMessage) && (
            <motion.div
              className="auth-global-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} />
              {authError || lineErrorMessage}
            </motion.div>
          )}

          {verificationEmail && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 20,
                color: "#1D4ED8",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              <p style={{ margin: 0 }}>
                帳號 <strong>{verificationEmail}</strong> 尚未完成 Email 驗證。
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                style={{
                  marginTop: 10,
                  border: "none",
                  background: "transparent",
                  color: "#1D4ED8",
                  fontWeight: 700,
                  cursor: isResendingVerification ? "default" : "pointer",
                  padding: 0,
                }}
              >
                {isResendingVerification ? "重新寄送中..." : "重新寄送驗證信"}
              </button>
              {verificationHint && (
                <p style={{ margin: "8px 0 0", fontSize: 13 }}>{verificationHint}</p>
              )}
            </motion.div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="apple-input"
                placeholder="name@example.com"
                value={email}
                autoComplete="email"
                onChange={(event) => {
                  setEmail(event.target.value)
                  setVerificationEmail("")
                  setVerificationHint("")
                  setErrors((prev) => ({ ...prev, email: "" }))
                }}
              />
              {errors.email && (
                <p className="auth-field-error">
                  <AlertCircle size={12} />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">密碼</label>
              <div className="auth-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="apple-input"
                  placeholder="請輸入密碼"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((prev) => ({ ...prev, password: "" }))
                  }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="auth-field-error">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="auth-options-row">
              <span className="auth-remember" style={{ cursor: "default" }}>
                安全登入
              </span>
              <Link to={ROUTES.FORGOT_PASSWORD} className="auth-forgot-link">
                忘記密碼？
              </Link>
            </div>

            <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="auth-spinner" />
                  登入中...
                </>
              ) : (
                "登入"
              )}
            </button>

            <div className="auth-divider">或</div>

            <button
              type="button"
              className="auth-social-btn"
              onClick={handleLineLogin}
              style={{ marginBottom: 20 }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#06C755">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              使用 LINE 登入
            </button>

            <p className="auth-switch">
              還沒有帳號？ <Link to={ROUTES.REGISTER}>立即註冊</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
