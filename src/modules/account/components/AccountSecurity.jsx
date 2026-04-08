import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, ShieldCheck, X } from 'lucide-react'
import { ROUTES } from '../../../constants/routes'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'

const DELETE_ACCOUNT_REMOVAL_ITEMS = [
  '會員資料',
  '收藏商品',
  '毛孩資訊',
  '收件地址',
  '安全設定',
  '通知偏好與追蹤紀錄',
]

const DELETE_ACCOUNT_RETENTION_ITEMS = [
  '依法需保留之訂單資料',
  '付款與退款紀錄',
  '客服服務紀錄',
  '電子發票相關資料',
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const getTodayDateString = () => {
  const today = new Date()
  return `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
}

const formatDate = (value) => {
  if (!value) return ''
  const [year, month, day] = value.split(/[/-]/).map(Number)
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
}

function LineBindModal({ show, user, onClose, onBind }) {
  const isLineLinked = !!user?.lineLinked

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="address-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="address-modal-wrapper">
            <motion.div
              className="address-modal"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="address-modal-header">
                <h3 className="address-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={18} color="#06C755" />
                  LINE 綁定
                </h3>
                <button className="address-modal-close" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  background: 'var(--color-bg-light)',
                  border: '1px solid var(--color-gray-light)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--color-gray-dark)', marginBottom: 4 }}>目前狀態</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: 4 }}>
                  {isLineLinked ? '已綁定 LINE 帳號' : '尚未綁定 LINE'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', lineHeight: 1.7 }}>
                  {isLineLinked
                    ? `${user?.lineDisplayName || 'Polar LINE 會員'}，綁定於 ${formatDate(user?.lineBoundAt || getTodayDateString())}`
                    : '綁定後可接收訂單通知與會員資訊，未來也可用 LINE Login 快速登入。'}
                </div>
              </div>

              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 24,
                  fontSize: 13,
                  color: '#166534',
                  lineHeight: 1.7,
                }}
              >
                目前為前端展示流程，正式串接後將導入 LINE Login OAuth 2.0 redirect。
              </div>

              <div className="address-modal-actions">
                <button className="btn-modal-cancel" onClick={onClose} style={{ minHeight: 44 }}>
                  取消
                </button>
                {!isLineLinked && (
                  <button
                    className="btn-modal-submit"
                    onClick={onBind}
                    style={{ minHeight: 44, background: '#06C755', color: '#FFFFFF', border: 'none' }}
                  >
                    立即綁定
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function DeleteAccountModal({
  show,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  acknowledged,
  setAcknowledged,
  isDeleting,
  onClose,
  onConfirm,
}) {
  const canConfirm = password.length >= 6 && acknowledged && !isDeleting

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="address-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!isDeleting) onClose() }}
          />

          <div className="address-modal-wrapper">
            <motion.div
              className="address-modal"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="address-modal-header">
                <h3 className="address-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden="true">⚠️</span>
                  刪除帳戶
                </h3>
                <button className="address-modal-close" onClick={onClose} disabled={isDeleting}>
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 16,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#B91C1C', marginBottom: 10 }}>
                    將會被移除的資料
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {DELETE_ACCOUNT_REMOVAL_ITEMS.map((item) => (
                      <div key={item} style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.6 }}>
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 16,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#166534', marginBottom: 10 }}>
                    依法保留資料
                  </div>
                  <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                    {DELETE_ACCOUNT_RETENTION_ITEMS.map((item) => (
                      <div key={item} style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                        • {item}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#15803D', lineHeight: 1.6 }}>
                    若有售後或法務需求，我們仍會依相關法規保留必要紀錄。
                  </div>
                </div>
              </div>

              <div className="address-form" style={{ gap: 18 }}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 6,
                    }}
                  >
                    <label className="address-form-label" style={{ marginBottom: 0 }}>
                      請輸入目前密碼
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isDeleting}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-brand-blue)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isDeleting ? 'default' : 'pointer',
                        padding: 0,
                      }}
                    >
                      {showPassword ? '隱藏' : '顯示'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="apple-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="請輸入目前密碼"
                    disabled={isDeleting}
                  />
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 14,
                    color: 'var(--color-text-dark)',
                    lineHeight: 1.7,
                    cursor: isDeleting ? 'default' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    disabled={isDeleting}
                    style={{ marginTop: 3 }}
                  />
                  <span>我已了解刪除後將無法復原，並確認要永久移除此帳戶。</span>
                </label>
              </div>

              <div className="address-modal-actions">
                <button
                  className="btn-modal-cancel"
                  onClick={onClose}
                  disabled={isDeleting}
                  style={{ minHeight: 44 }}
                >
                  取消
                </button>
                <button
                  className="btn-modal-submit"
                  onClick={onConfirm}
                  disabled={!canConfirm}
                  style={{
                    minHeight: 44,
                    background: canConfirm ? '#E74C3C' : '#E5E7EB',
                    color: canConfirm ? '#FFFFFF' : '#6B7280',
                    border: 'none',
                    cursor: canConfirm ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isDeleting ? '刪除中...' : '確認刪除帳戶'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function AccountSecurity() {
  const navigate = useNavigate()
  const { user, updateProfile, changePassword, logout, isLoading } = useAuth()
  const toast = useToast()

  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [showLineBindModal, setShowLineBindModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('')
  const [showDeleteAccountPassword, setShowDeleteAccountPassword] = useState(false)
  const [deleteAccountConfirmed, setDeleteAccountConfirmed] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const isLineLinked = !!user?.lineLinked

  const resetDeleteAccountState = () => {
    setDeleteAccountPassword('')
    setShowDeleteAccountPassword(false)
    setDeleteAccountConfirmed(false)
    setIsDeletingAccount(false)
  }

  const openDeleteAccountModal = () => {
    resetDeleteAccountState()
    setShowDeleteAccountModal(true)
  }

  const closeDeleteAccountModal = () => {
    if (isDeletingAccount) return
    setShowDeleteAccountModal(false)
    resetDeleteAccountState()
  }

  const handleMockLineBind = async () => {
    try {
      const result = await updateProfile({
        lineLinked: true,
        lineDisplayName: `${user?.name || 'Polar 會員'} 的 LINE`,
        lineBoundAt: getTodayDateString(),
      })

      if (result?.success === false) {
        throw new Error(result?.message || 'LINE 綁定失敗，請稍後再試')
      }

      toast.success('LINE 綁定成功')
      setShowLineBindModal(false)
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
      setShowLineBindModal(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      if (!passwordForm.old || !passwordForm.new || !passwordForm.confirm) {
        setPasswordError('請完整填寫欄位')
        return
      }

      if (passwordForm.new !== passwordForm.confirm) {
        setPasswordError('兩次輸入的新密碼不一致')
        return
      }

      if (passwordForm.new.length < 8) {
        setPasswordError('新密碼至少需要 8 個字元')
        return
      }

      const result = await changePassword(passwordForm.old, passwordForm.new)
      if (result?.success === false) {
        setPasswordError(result?.message || '密碼更新失敗，請稍後再試')
        return
      }

      setPasswordForm({ old: '', new: '', confirm: '' })
      setPasswordError('')
      toast.success('密碼更新成功')
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteAccountPassword.length < 6 || !deleteAccountConfirmed || isDeletingAccount) return

    try {
      setIsDeletingAccount(true)
      await new Promise((resolve) => setTimeout(resolve, 800))
      setShowDeleteAccountModal(false)
      resetDeleteAccountState()
      await logout()
      navigate(ROUTES.HOME)
    } catch (err) {
      setIsDeletingAccount(false)
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  return (
    <motion.div key="security" {...fadeUp}>
      <h2 className="account-section-title">
        <ShieldCheck size={22} className="account-nav-icon" />
        帳號安全
      </h2>

      <LineBindModal
        show={showLineBindModal}
        user={user}
        onClose={() => setShowLineBindModal(false)}
        onBind={handleMockLineBind}
      />

      <DeleteAccountModal
        show={showDeleteAccountModal}
        password={deleteAccountPassword}
        setPassword={setDeleteAccountPassword}
        showPassword={showDeleteAccountPassword}
        setShowPassword={setShowDeleteAccountPassword}
        acknowledged={deleteAccountConfirmed}
        setAcknowledged={setDeleteAccountConfirmed}
        isDeleting={isDeletingAccount}
        onClose={closeDeleteAccountModal}
        onConfirm={handleDeleteAccount}
      />

      <div className="security-section">
        <div className="security-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="security-item-info" style={{ marginBottom: 20 }}>
            <h4>變更密碼</h4>
            <p>定期更新密碼，能更有效保護您的帳號安全。</p>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
            {[
              { field: 'old', label: '目前密碼' },
              { field: 'new', label: '新密碼（至少 8 碼）' },
              { field: 'confirm', label: '再次確認新密碼' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label
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
                  type="password"
                  className="apple-input"
                  value={passwordForm[field]}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}

            {passwordError && <p style={{ fontSize: 13, color: '#e74c3c' }}>{passwordError}</p>}

            <button
              className="btn-blue"
              style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 980, fontSize: 15 }}
              onClick={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? '儲存中...' : '更新密碼'}
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
                ? `${user?.lineDisplayName || '已綁定的 LINE 帳號'}，可接收訂單與會員通知。`
                : '綁定 LINE 後，可接收訂單狀態通知，未來也能使用 LINE 快速登入。'}
            </p>
          </div>

          <button
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
            onClick={() => setShowLineBindModal(true)}
          >
            {isLineLinked ? '查看綁定資訊' : '綁定 LINE'}
          </button>
        </div>

        <div className="security-item" style={{ borderColor: '#fee2e2' }}>
          <div className="security-item-info">
            <h4 style={{ color: '#e74c3c' }}>刪除帳戶</h4>
            <p>此操作無法復原，請務必確認後再繼續。</p>
          </div>

          <button
            style={{
              padding: '8px 16px',
              borderRadius: 980,
              border: '1.5px solid #e74c3c',
              background: 'transparent',
              color: '#e74c3c',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: 44,
            }}
            onClick={openDeleteAccountModal}
          >
            刪除帳戶
          </button>
        </div>
      </div>
    </motion.div>
  )
}
