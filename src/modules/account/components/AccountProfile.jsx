import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import { CONFIG } from '../../../constants/config'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'

const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AVATAR_FILE_SIZE = CONFIG.MAX_AVATAR_SIZE ?? 5 * 1024 * 1024
const MAX_AVATAR_SIZE_MB = Math.round(MAX_AVATAR_FILE_SIZE / 1024 / 1024)
const mockAnnualSpend = 1100
const nextTierAmount = 10000

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const getAnnualSpendTier = (annualSpend) => {
  if (annualSpend >= 100000) return { label: 'Polar Diamond', color: '#003153', bg: '#EBF2F8' }
  if (annualSpend >= 50000) return { label: 'Polar Gold', color: '#8B5A2B', bg: '#FDF3E3' }
  if (annualSpend >= 10000) return { label: 'Polar Silver', color: '#6B7280', bg: '#F3F4F6' }
  return { label: 'Polar Member', color: '#8A7E71', bg: '#F3EFE6' }
}

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'PL')

function AccountProfileCard({ user, tier, onAvatarUpload }) {
  const inputRef = useRef(null)

  return (
    <div className="account-profile-card" style={{ marginBottom: 24 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="account-avatar-input"
        onChange={onAvatarUpload}
      />
      <button
        type="button"
        className="account-avatar account-avatar-button"
        onClick={() => inputRef.current?.click()}
        aria-label="更換頭像"
      >
        {user?.avatar ? <img src={user.avatar} alt={user?.name || '會員頭像'} /> : getInitials(user?.name)}
        <span className="account-avatar-overlay">
          <Camera size={18} />
        </span>
      </button>
      <div className="account-user-name">{`嗨，${user?.name ?? '會員'}`}</div>
      <div className="account-user-email">你和毛孩的所有紀錄，都在這裡。</div>
      <div className="account-tier-badge" style={{ background: tier.bg, color: tier.color }}>
        <span>會員等級 {tier.label}</span>
      </div>
      <div className="account-points-row">
        <span>目前點數</span>
        <span className="account-points-value">
          {(user?.points || 0).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default function AccountProfile() {
  const { user, updateProfile, isLoading } = useAuth()
  const toast = useToast()

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    birthday: user?.birthday || '',
    gender: user?.gender || '',
  })

  const tier = getAnnualSpendTier(mockAnnualSpend)
  const progressPct = Math.min((mockAnnualSpend / nextTierAmount) * 100, 100)
  const remainingToNextTier = Math.max(nextTierAmount - mockAnnualSpend, 0)

  const handleUpdateProfile = async () => {
    try {
      const result = await updateProfile(profileForm)
      if (result?.success === false) {
        throw new Error(result?.message || '儲存失敗，請稍後再試')
      }
      toast.success('已儲存。')
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
      toast.error('僅支援 JPG / PNG / WebP / GIF 格式')
      return
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      toast.error(`頭像大小不可超過 ${MAX_AVATAR_SIZE_MB}MB`)
      return
    }

    const reader = new FileReader()

    reader.onload = async () => {
      try {
        const avatar = typeof reader.result === 'string' ? reader.result : ''

        if (!avatar) {
          throw new Error('頭像讀取失敗，請重新選擇檔案')
        }

        const result = await updateProfile({ avatar })
        if (result?.success === false) {
          throw new Error(result?.message || '頭像更新失敗，請稍後再試')
        }

        toast.success('頭像更新成功')
      } catch (err) {
        toast.error(err?.message || '操作失敗，請稍後再試')
      }
    }

    reader.onerror = () => {
      toast.error('頭像讀取失敗，請重新選擇檔案')
    }

    reader.readAsDataURL(file)
  }

  return (
    <motion.div key="profile" {...fadeUp}>
      <h2 className="account-section-title">
        <User size={22} className="account-nav-icon" />
        你的資料
      </h2>

      <AccountProfileCard
        user={user}
        tier={tier}
        onAvatarUpload={handleAvatarUpload}
      />

      <div className="tier-progress-section">
        <div className="tier-progress-label">
          <span>
            <strong style={{ color: 'var(--color-brand-coffee)' }}>
              NT$ {mockAnnualSpend.toLocaleString()}
            </strong>
          </span>
          <span>
            距離下一個會員等級還差 {remainingToNextTier.toLocaleString()} 元
          </span>
        </div>
        <div className="tier-progress-bar">
          <div className="tier-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="profile-form">
        <div className="profile-form-row">
          <div className="profile-field">
            <label>姓名</label>
            <input
              type="text"
              className="apple-input"
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="profile-field">
            <label>手機號碼</label>
            <input
              type="tel"
              className="apple-input"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="profile-form-row">
          <div className="profile-field">
            <label>
              電子郵件
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--color-gray-dark)',
                  background: 'var(--color-bg-light)',
                  border: '1px solid var(--color-gray-light)',
                  borderRadius: 980,
                  padding: '1px 8px',
                }}
              >
                需聯絡客服協助修改
              </span>
            </label>
            <input
              type="email"
              className="apple-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          <div className="profile-field">
            <label>
              生日
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--color-gray-dark)',
                  background: 'var(--color-bg-light)',
                  border: '1px solid var(--color-gray-light)',
                  borderRadius: 980,
                  padding: '1px 8px',
                }}
              >
                僅能建立後修改
              </span>
            </label>
            <input
              type="date"
              className="apple-input"
              value={profileForm.birthday}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="profile-field" style={{ maxWidth: 300 }}>
          <label>性別</label>
          <select
            className="apple-input select-input"
            value={profileForm.gender}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
          >
            <option value="">請選擇</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">不方便透露</option>
          </select>
        </div>

        <div>
          <button
            className="btn-blue profile-save-btn"
            onClick={handleUpdateProfile}
            disabled={isLoading}
          >
            {isLoading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
