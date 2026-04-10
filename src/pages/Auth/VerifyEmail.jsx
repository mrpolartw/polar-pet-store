import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle2, MailCheck, XCircle } from "lucide-react"

import { SEOHead, LoadingSpinner } from "../../components/common"
import authService from "../../services/authService"
import { ROUTES } from "../../constants/routes"
import "./Auth.css"

const STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ALREADY: "already",
  EXPIRED: "expired",
  USED: "used",
  INVALID: "invalid",
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get("token") || "", [searchParams])
  const [status, setStatus] = useState(() => (token ? STATUS.LOADING : STATUS.INVALID))
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) return undefined

    let isMounted = true

    const confirm = async () => {
      try {
        const response = await authService.confirmEmailVerification(token)
        if (!isMounted) return

        switch (response?.status) {
          case "verified":
            setStatus(STATUS.SUCCESS)
            break
          case "already_verified":
            setStatus(STATUS.ALREADY)
            break
          case "token_expired":
            setStatus(STATUS.EXPIRED)
            break
          case "token_used":
            setStatus(STATUS.USED)
            break
          default:
            setStatus(STATUS.INVALID)
        }

        setMessage(response?.message || "")
      } catch (error) {
        if (!isMounted) return
        setStatus(STATUS.INVALID)
        setMessage(
          error?.body?.message || error?.message || "驗證失敗，請重新申請驗證信。"
        )
      }
    }

    confirm()

    return () => {
      isMounted = false
    }
  }, [token])

  if (status === STATUS.LOADING) {
    return (
      <main className="reset-password-page">
        <SEOHead title="Email 驗證" noIndex={true} />
        <LoadingSpinner size="large" fullPage={true} label="正在驗證 Email..." />
      </main>
    )
  }

  const isSuccess = status === STATUS.SUCCESS || status === STATUS.ALREADY

  return (
    <main className="reset-password-page">
      <SEOHead title="Email 驗證" noIndex={true} />
      <div className="reset-password-card">
        <div
          className={`reset-password-icon ${
            isSuccess ? "reset-password-icon--success" : "reset-password-icon--error"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 size={32} strokeWidth={1.5} />
          ) : (
            <XCircle size={32} strokeWidth={1.5} />
          )}
        </div>
        <h1 className="reset-password-title">
          {status === STATUS.SUCCESS && "Email 驗證成功"}
          {status === STATUS.ALREADY && "Email 已完成驗證"}
          {status === STATUS.EXPIRED && "驗證連結已過期"}
          {status === STATUS.USED && "驗證連結已使用"}
          {status === STATUS.INVALID && "驗證連結無效"}
        </h1>
        <p className="reset-password-desc">
          {message || "請重新申請驗證信後再試一次。"}
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <Link to={ROUTES.LOGIN} className="btn-blue reset-password-submit">
            前往登入
          </Link>
          {!isSuccess && (
            <Link to={ROUTES.REGISTER} className="auth-social-btn" style={{ textDecoration: "none" }}>
              <MailCheck size={18} />
              返回註冊
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
