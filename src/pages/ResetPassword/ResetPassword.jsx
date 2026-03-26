import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { KeyRound, XCircle, CheckCircle2 } from 'lucide-react'
import { SEOHead, LoadingSpinner } from '../../components/common'
import { ROUTES } from '../../constants/routes'
import './ResetPassword.css'

const STATUS = {
  LOADING:  'loading',
  VALID:    'valid',
  INVALID:  'invalid',
  SUCCESS:  'success',
}

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [status, setStatus]       = useState(() => (
    token ? STATUS.LOADING : STATUS.INVALID
  ))
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [errors, setErrors]       = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return undefined
    // TODO BACKEND: 驗證 token 是否有效
    // await authService.validateResetToken(token)
    const timer = setTimeout(() => setStatus(STATUS.VALID), 800)
    return () => clearTimeout(timer)
  }, [token])

  useEffect(() => {
    if (status !== STATUS.SUCCESS) return
    const timer = setTimeout(() => navigate(ROUTES.LOGIN), 3000)
    return () => clearTimeout(timer)
  }, [status, navigate])

  const validate = () => {
    const next = {}
    if (!password) {
      next.password = '請輸入新密碼'
    } else if (password.length < 8) {
      next.password = '密碼長度至少 8 個字元'
    }
    if (!confirm) {
      next.confirm = '請再次輸入密碼'
    } else if (password !== confirm) {
      next.confirm = '兩次輸入的密碼不一致'
    }
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = validate()
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setIsSubmitting(true)
    setErrors({})
    // TODO BACKEND: await authService.resetPassword(token, password)
    await new Promise((r) => setTimeout(r, 900))
    setIsSubmitting(false)
    setStatus(STATUS.SUCCESS)
  }

  if (status === STATUS.LOADING) {
    return (
      <main className="reset-password-page">
        <SEOHead title="密碼重設" noIndex={true} />
        <LoadingSpinner size="large" fullPage={true} label="驗證連結中..." />
      </main>
    )
  }

  if (status === STATUS.INVALID) {
    return (
      <main className="reset-password-page">
        <SEOHead title="密碼重設" noIndex={true} />
        <div className="reset-password-card">
          <div className="reset-password-icon reset-password-icon--error">
            <XCircle size={32} strokeWidth={1.5} />
          </div>
          <h1 className="reset-password-title">連結已失效</h1>
          <p className="reset-password-desc">
            此密碼重設連結已過期或無效（有效期限 24 小時），
            請重新申請。
          </p>
          <Link to={ROUTES.FORGOTPASSWORD} className="btn-blue reset-password-submit">
            重新申請密碼重設
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
        <SEOHead title="密碼重設成功" noIndex={true} />
        <div className="reset-password-card">
          <div className="reset-password-icon reset-password-icon--success">
            <CheckCircle2 size={32} strokeWidth={1.5} />
          </div>
          <h1 className="reset-password-title">密碼已更新！</h1>
          <p className="reset-password-desc">
            您的密碼已成功更新。<br />
            3 秒後自動跳轉至登入頁面...
          </p>
          <Link to={ROUTES.LOGIN} className="btn-blue reset-password-submit">
            立即前往登入
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
          請輸入您的新密碼，長度至少 8 個字元。
        </p>

        <form className="reset-password-form" onSubmit={handleSubmit} noValidate>
          <div className="reset-password-field">
            <label htmlFor="new-password">新密碼</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              className={errors.password ? 'is-error' : ''}
              placeholder="至少 8 個字元"
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
              onChange={(e) => {
                setConfirm(e.target.value)
                setErrors((prev) => ({ ...prev, confirm: undefined }))
              }}
              className={errors.confirm ? 'is-error' : ''}
              placeholder="再次輸入密碼"
              autoComplete="new-password"
            />
            {errors.confirm && (
              <p className="reset-password-field-error">{errors.confirm}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-blue reset-password-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? '更新中...' : '確認更新密碼'}
          </button>
        </form>

        <p className="reset-password-link">
          <Link to={ROUTES.LOGIN}>返回登入</Link>
        </p>
      </div>
    </main>
  )
}
