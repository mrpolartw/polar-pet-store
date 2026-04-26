import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { CheckCircle2, KeyRound, XCircle } from "lucide-react"

import { SEOHead, LoadingSpinner } from "../../components/common"
import { ROUTES } from "../../constants/routes"
import { validatePassword, validatePasswordConfirm } from "../../utils/validators"
import "./ResetPassword.css"

const STATUS = {
  LOADING: "loading",
  VALID: "valid",
  INVALID: "invalid",
  EXPIRED: "expired",
  USED: "used",
  SUCCESS: "success",
}

export default function ResetPassword() {
  const { token: tokenParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(
    () => tokenParam || searchParams.get("token") || "",
    [searchParams, tokenParam]
  )

  const [status, setStatus] = useState(() => (token ? STATUS.LOADING : STATUS.INVALID))
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverMessage, setServerMessage] = useState("")

  useEffect(() => {
    if (!token) return undefined

    let isMounted = true

    const validateToken = async () => {
      await new Promise((r) => setTimeout(r, 300))
      if (!isMounted) return

      setStatus(STATUS.VALID)
    }

    validateToken()

    return () => {
      isMounted = false
    }
  }, [token])

  useEffect(() => {
    if (status !== STATUS.SUCCESS) return undefined

    const timer = setTimeout(() => navigate(ROUTES.LOGIN), 3000)
    return () => clearTimeout(timer)
  }, [navigate, status])

  const validate = () => {
    const nextErrors = {}
    const passwordError = validatePassword(password)
    if (passwordError) nextErrors.password = passwordError
    const confirmError = validatePasswordConfirm(password, confirm)
    if (confirmError) nextErrors.confirm = confirmError
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setServerMessage("")

    await new Promise((r) => setTimeout(r, 500))
    setStatus(STATUS.SUCCESS)
    setServerMessage("密碼已更新，請使用新密碼登入。")
    setIsSubmitting(false)
  }

  if (status === STATUS.LOADING) {
    return (
      <main className="reset-password-page">
        <SEOHead title="重設密碼" noIndex={true} />
        <LoadingSpinner size="large" fullPage={true} label="正在驗證重設連結..." />
      </main>
    )
  }

  if (status === STATUS.INVALID || status === STATUS.EXPIRED || status === STATUS.USED) {
    const title =
      status === STATUS.EXPIRED
        ? "重設連結已過期"
        : status === STATUS.USED
          ? "重設連結已使用"
          : "重設連結無效"

    return (
      <main className="reset-password-page">
        <SEOHead title="重設密碼" noIndex={true} />
        <div className="reset-password-card">
          <div className="reset-password-icon reset-password-icon--error">
            <XCircle size={32} strokeWidth={1.5} />
          </div>
          <h1 className="reset-password-title">{title}</h1>
          <p className="reset-password-desc">
            {serverMessage || "請重新申請重設密碼連結。"}
          </p>
          <Link to={ROUTES.FORGOT_PASSWORD} className="btn-blue reset-password-submit">
            重新申請重設密碼
          </Link>
          <p className="reset-password-link">
            想起密碼了？<Link to={ROUTES.LOGIN}>返回登入</Link>
          </p>
        </div>
      </main>
    )
  }

  if (status === STATUS.SUCCESS) {
    return (
      <main className="reset-password-page">
        <SEOHead title="密碼已更新" noIndex={true} />
        <div className="reset-password-card">
          <div className="reset-password-icon reset-password-icon--success">
            <CheckCircle2 size={32} strokeWidth={1.5} />
          </div>
          <h1 className="reset-password-title">密碼已更新</h1>
          <p className="reset-password-desc">
            {serverMessage}
            <br />
            3 秒後將自動導向登入頁。
          </p>
          <Link to={ROUTES.LOGIN} className="btn-blue reset-password-submit">
            前往登入
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="reset-password-page">
      <SEOHead title="設定新密碼" noIndex={true} />
      <div className="reset-password-card">
        <div className="reset-password-icon reset-password-icon--default">
          <KeyRound size={32} strokeWidth={1.5} />
        </div>
        <h1 className="reset-password-title">設定新密碼</h1>
        <p className="reset-password-desc">
          新密碼至少需 8 碼，並包含 1 個大寫英文字母與 1 個數字。
        </p>

        <form className="reset-password-form" onSubmit={handleSubmit} noValidate>
          <div className="reset-password-field">
            <label htmlFor="new-password">新密碼</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              className={errors.password ? "is-error" : ""}
              placeholder="至少 8 碼"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="reset-password-field-error">{errors.password}</p>
            )}
          </div>

          <div className="reset-password-field">
            <label htmlFor="confirm-password">確認新密碼</label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value)
                setErrors((prev) => ({ ...prev, confirm: undefined }))
              }}
              className={errors.confirm ? "is-error" : ""}
              placeholder="請再次輸入新密碼"
              autoComplete="new-password"
            />
            {errors.confirm && (
              <p className="reset-password-field-error">{errors.confirm}</p>
            )}
          </div>

          {serverMessage && (
            <p className="reset-password-field-error" style={{ marginTop: -4 }}>
              {serverMessage}
            </p>
          )}

          <button type="submit" className="btn-blue reset-password-submit" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "更新密碼"}
          </button>
        </form>

        <p className="reset-password-link">
          <Link to={ROUTES.LOGIN}>返回登入</Link>
        </p>
      </div>
    </main>
  )
}
