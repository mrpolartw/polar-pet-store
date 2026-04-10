import React, { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"

import LogoImg from "../../png/LOGO.png"
import MLogoImg from "../../png/LOGO_remove_background.png"
import authService from "../../services/authService"
import { validateEmail } from "../../utils/validators"
import "./Auth.css"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const emailError = validateEmail(email)

    if (emailError) {
      setError(emailError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await authService.requestPasswordReset(email)
      setSuccessMessage(
        response?.message ||
          "如果這個 E-mail 已完成註冊，我們會寄出重設密碼的信。請在 15 分鐘內完成設定。"
      )
    } catch (err) {
      setError(err?.body?.message || err?.message || "目前無法送出申請，請稍後再試。")
    } finally {
      setIsLoading(false)
    }
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
            忘記密碼？
            <br />
            沒關係，我們陪你找回來
          </h2>
          <p>輸入你的 E-mail，我們會寄送重設密碼連結。請在 15 分鐘內完成設定。</p>
        </div>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon">
              <Mail size={16} />
            </div>
            <span>重設密碼連結會寄到你的信箱</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div
          className="auth-form-container"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="auth-mobile-logo">
            <Link to="/">
              <img
                src={MLogoImg}
                alt="Mr. Polar"
                style={{ height: "auto", width: 293, maxWidth: "100%", display: "block" }}
              />
            </Link>
          </div>

          <div className="auth-header">
            <h1>忘記密碼</h1>
            <p>輸入註冊時使用的 E-mail，我們會寄送重設密碼連結給你。</p>
          </div>

          {successMessage ? (
            <div className="auth-success-box">
              <div className="success-icon">✓</div>
              <h3>申請已送出</h3>
              <p>{successMessage}</p>
              <p className="auth-switch" style={{ marginTop: 16 }}>
                <Link to="/login">返回登入</Link>
              </p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="apple-input"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError("")
                  }}
                />
                {error && (
                  <p className="auth-field-error">
                    <AlertCircle size={12} />
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" className="btn-blue auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="auth-spinner" />
                    寄送中...
                  </>
                ) : (
                  "寄送重設連結"
                )}
              </button>

              <p className="auth-switch">
                <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ArrowLeft size={14} />
                  返回登入
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword