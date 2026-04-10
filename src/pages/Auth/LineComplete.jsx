import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AlertCircle, CheckCircle2, MessageCircle } from "lucide-react"

import { SEOHead } from "../../components/common"
import authService from "../../services/authService"
import { useAuth } from "../../context/useAuth"
import { validateEmail, validateName } from "../../utils/validators"
import "./Auth.css"

export default function LineComplete() {
  const [searchParams] = useSearchParams()
  const { reloadSession } = useAuth()
  const token = useMemo(() => searchParams.get("token") || "", [searchParams])

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [serverError, setServerError] = useState("")

  const validate = () => {
    const nextErrors = {}
    const emailError = validateEmail(email)
    if (emailError) nextErrors.email = emailError
    if (name.trim()) {
      const nameError = validateName(name)
      if (nameError) nextErrors.name = nameError
    }
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()

    if (!token) {
      setServerError("LINE 補資料連結無效，請重新登入 LINE。")
      return
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setServerError("")

    try {
      const response = await authService.completeLineRegistration({
        token,
        email,
        name: name.trim() || undefined,
      })

      await reloadSession()
      setSuccessMessage("LINE 註冊完成，正在為你導回會員中心...")
      setTimeout(() => {
        window.location.assign(
          response?.redirect_to || `${window.location.origin}/polar-pet-store/account`
        )
      }, 800)
    } catch (error) {
      setServerError(
        error?.body?.message || error?.message || "LINE 補資料失敗，請稍後再試。"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="reset-password-page">
      <SEOHead title="完成 LINE 註冊" noIndex={true} />
      <div className="reset-password-card">
        <div className="reset-password-icon reset-password-icon--default">
          {successMessage ? (
            <CheckCircle2 size={32} strokeWidth={1.5} />
          ) : (
            <MessageCircle size={32} strokeWidth={1.5} />
          )}
        </div>
        <h1 className="reset-password-title">完成 LINE 註冊</h1>
        <p className="reset-password-desc">
          LINE 尚未提供完整會員資料，請補上 Email 與顯示名稱，以完成帳號建立。
        </p>

        {serverError && (
          <div className="auth-global-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            {serverError}
          </div>
        )}

        {successMessage ? (
          <p className="reset-password-desc">{successMessage}</p>
        ) : (
          <form className="reset-password-form" onSubmit={handleSubmit} noValidate>
            <div className="reset-password-field">
              <label htmlFor="line-email">Email</label>
              <input
                id="line-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                className={errors.email ? "is-error" : ""}
                placeholder="name@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="reset-password-field-error">{errors.email}</p>}
            </div>

            <div className="reset-password-field">
              <label htmlFor="line-name">顯示名稱（選填）</label>
              <input
                id="line-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                className={errors.name ? "is-error" : ""}
                placeholder="請輸入姓名"
                autoComplete="name"
              />
              {errors.name && <p className="reset-password-field-error">{errors.name}</p>}
            </div>

            <button type="submit" className="btn-blue reset-password-submit" disabled={isSubmitting}>
              {isSubmitting ? "送出中..." : "完成 LINE 註冊"}
            </button>
          </form>
        )}

        <p className="reset-password-link">
          <Link to="/login">返回登入</Link>
        </p>
      </div>
    </main>
  )
}
