import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck, MessageCircle, ShieldCheck } from 'lucide-react'

import authService from '../../../services/authService'
import { ROUTES } from '../../../constants/routes'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'
import { validatePassword, validatePasswordConfirm } from '../../../utils/validators'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

export default function AccountSecurity() {
  const navigate = useNavigate()
  const { user, changePassword, logout, isLoading } = useAuth()
  const toast = useToast()

  const [passwordForm, setPasswordForm] = useState({ old: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')

  const isLineLinked = Boolean(user?.lineLinked)
  const isEmailVerified = Boolean(user?.emailVerified)

  const handleChangePassword = async () => {
    if (!passwordForm.old || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError('請完整填寫目前密碼、新密碼與確認密碼。')
      return
    }

    const passwordErrorMessage = validatePassword(passwordForm.next)
    if (passwordErrorMessage) {
      setPasswordError(passwordErrorMessage)
      return
    }

    const confirmError = validatePasswordConfirm(passwordForm.next, passwordForm.confirm)
    if (confirmError) {
      setPasswordError(confirmError)
      return
    }

    const result = await changePassword(passwordForm.old, passwordForm.next)

    if (result?.success === false) {
      setPasswordError(result?.message || '密碼更新失敗，請稍後再試。')
      return
    }

    setPasswordError('')
    setPasswordForm({ old: '', next: '', confirm: '' })
    toast.success('密碼已更新。')
  }

  const handleLineBind = () => {
    const redirectTo = `${window.location.origin}/polar-pet-store/account#security`
    window.location.assign(authService.getLineBindUrl(redirectTo))
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.HOME)
  }

  return (
    <motion.div key="security" {...fadeUp}>
      <h2 className="account-section-title">
        <ShieldCheck size={22} className="account-nav-icon" />
        帳號安全
      </h2>

      <div className="security-section">
        <div className="security-item" style={{ flexWrap: 'wrap' }}>
          <div className="security-item-info">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MailCheck size={18} color={isEmailVerified ? '#16A34A' : '#F59E0B'} />
              Email 驗證狀態
            </h4>
            <p>
              {isEmailVerified
                ? '此 Email 已完成驗證，可正常使用 Email / 密碼登入。'
                : '此 Email 尚未完成驗證，建議先完成驗證，以免影響 Email / 密碼登入。'}
            </p>
          </div>
          <span
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              background: isEmailVerified ? '#ECFDF3' : '#FEF3C7',
              color: isEmailVerified ? '#15803D' : '#B45309',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {isEmailVerified ? '已驗證' : '未驗證'}
          </span>
        </div>

        <div className="security-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="security-item-info" style={{ marginBottom: 20 }}>
            <h4>變更密碼</h4>
            <p>請輸入目前密碼、新密碼與確認密碼。新密碼至少需 8 碼，並符合目前的密碼規則。</p>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
            {[
              {
                field: 'old',
                label: '目前密碼',
                id: 'account-security-password-old',
                name: 'currentPassword',
                autoComplete: 'current-password',
              },
              {
                field: 'next',
                label: '新密碼',
                id: 'account-security-password-new',
                name: 'newPassword',
                autoComplete: 'new-password',
              },
              {
                field: 'confirm',
                label: '確認新密碼',
                id: 'account-security-password-confirm',
                name: 'confirmPassword',
                autoComplete: 'new-password',
              },
            ].map(({ field, label, id, name, autoComplete }) => (
              <div key={field}>
                <label
                  htmlFor={id}
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1d1d1f',
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  id={id}
                  name={name}
                  type="password"
                  autoComplete={autoComplete}
                  className="apple-input"
                  value={passwordForm[field]}
                  onChange={(event) => {
                    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }))
                    setPasswordError('')
                  }}
                />
              </div>
            ))}

            {passwordError ? <p style={{ fontSize: 13, color: '#e74c3c' }}>{passwordError}</p> : null}

            <button
              type="button"
              className="btn-blue"
              style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 980, fontSize: 15 }}
              onClick={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? '更新中...' : '更新密碼'}
            </button>
          </div>
        </div>

        <div className="security-item" style={{ flexWrap: 'wrap' }}>
          <div className="security-item-info">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={18} color="#06C755" />
              LINE 綁定
            </h4>
            <p>
              {isLineLinked
                ? `目前已綁定 LINE 帳號：${user?.lineDisplayName || '已綁定帳號'}`
                : '綁定 LINE 後，可在支援的情境下使用 LINE 快速登入。'}
            </p>
          </div>

          <button
            type="button"
            style={{
              padding: '10px 18px',
              borderRadius: 980,
              border: isLineLinked ? '1.5px solid #06C755' : 'none',
              background: isLineLinked ? '#ECFDF3' : '#06C755',
              color: isLineLinked ? '#06C755' : '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
              flexShrink: 0,
            }}
            onClick={handleLineBind}
          >
            {isLineLinked ? '重新綁定 LINE' : '綁定 LINE'}
          </button>
        </div>

        <div className="security-item" style={{ borderColor: '#e5e7eb' }}>
          <div className="security-item-info">
            <h4>登出目前裝置</h4>
            <p>如果你在共用或公共裝置上使用帳號，離開前請記得登出，以保護會員資料安全。</p>
          </div>

          <button
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: 980,
              border: '1.5px solid var(--color-brand-blue)',
              background: 'transparent',
              color: 'var(--color-brand-blue)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: 44,
            }}
            onClick={handleLogout}
          >
            登出
          </button>
        </div>
      </div>
    </motion.div>
  )
}
