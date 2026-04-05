import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import { CONFIG } from '../../../constants/config'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'
import { getMemberTier } from '../../../context/authUtils'
import { useMember } from '../../../hooks/useMember'
import { MEMBER_TIER_THRESHOLD } from '../../../utils/constants'

const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AVATAR_FILE_SIZE = CONFIG.MAX_AVATAR_SIZE ?? 5 * 1024 * 1024
const MAX_AVATAR_SIZE_MB = Math.round(MAX_AVATAR_FILE_SIZE / 1024 / 1024)

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const getNextTierPoints = (points) => {
  if (points >= MEMBER_TIER_THRESHOLD.DIAMOND) return null
  if (points >= MEMBER_TIER_THRESHOLD.GOLD) return MEMBER_TIER_THRESHOLD.DIAMOND
  if (points >= MEMBER_TIER_THRESHOLD.SILVER) return MEMBER_TIER_THRESHOLD.GOLD
  return MEMBER_TIER_THRESHOLD.SILVER
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
        aria-label="更新頭像"
      >
        {user?.avatar ? <img src={user.avatar} alt={user?.name || '會員頭像'} /> : getInitials(user?.name)}
        <span className="account-avatar-overlay">
          <Camera size={18} />
        </span>
      </button>
      <div className="account-user-name">{`哈囉，${user?.name ?? '會員'}`}</div>
      <div className="account-user-email">點擊頭像可上傳新的會員照片</div>
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
  const { user, isLoading } = useAuth()
  const { member, loading, updateMember } = useMember()
  const toast = useToast()

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    birthday: user?.birthday || '',
    gender: user?.gender || '',
    avatar: user?.avatar || '',
  })

  useEffect(() => {
    if (!member) return

    setProfileForm((prev) => ({
      ...prev,
      name: member.display_name || '',
      phone: member.phone || '',
      birthday: member.birthday || '',
      gender: member.gender || '',
      avatar: member.avatar_url || '',
    }))
  }, [member])

  const profileUser = {
    ...user,
    name: member?.display_name || user?.name || '',
    email: member?.email || user?.email || '',
    phone: member?.phone || user?.phone || '',
    birthday: member?.birthday || user?.birthday || '',
    gender: member?.gender || user?.gender || '',
    avatar: member?.avatar_url || profileForm.avatar || user?.avatar || '',
    points: Number(member?.points_balance ?? user?.points ?? 0),
  }

  const points = profileUser?.points || 0
  const tier = getMemberTier(points)
  const nextTierPoints = getNextTierPoints(points)
  const progressPct = nextTierPoints ? Math.min((points / nextTierPoints) * 100, 100) : 100
  const remainingToNextTier = nextTierPoints ? Math.max(nextTierPoints - points, 0) : 0

  const handleUpdateProfile = async () => {
    try {
      await updateMember({
        display_name: profileForm.name,
        phone: profileForm.phone,
        gender: profileForm.gender,
        birthday: profileForm.birthday,
        avatar_url: profileForm.avatar,
      })
      toast.success('資料已更新')
    } catch (err) {
      toast.error(err?.message || '更新失敗，請稍後再試')
    }
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
      toast.error('請上傳 JPG / PNG / WebP / GIF 圖片')
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
          throw new Error('無法讀取頭像檔案')
        }

        await updateMember({ avatar_url: avatar })
        setProfileForm((prev) => ({ ...prev, avatar }))
        toast.success('頭像已更新')
      } catch (err) {
        toast.error(err?.message || '更新失敗，請稍後再試')
      }
    }

    reader.onerror = () => {
      toast.error('無法讀取頭像檔案')
    }

    reader.readAsDataURL(file)
  }

  return (
    <motion.div key="profile" {...fadeUp}>
      <h2 className="account-section-title">
        <User size={22} className="account-nav-icon" />
        個人資料
      </h2>

      <AccountProfileCard
        user={profileUser}
        tier={tier}
        onAvatarUpload={handleAvatarUpload}
      />

      <div className="tier-progress-section">
        <div className="tier-progress-label">
          <span>
            <strong style={{ color: 'var(--color-brand-coffee)' }}>
              {points.toLocaleString()} 點
            </strong>
          </span>
          <span>
            {nextTierPoints
              ? `距離下一個等級還差 ${remainingToNextTier.toLocaleString()} 點`
              : '你已經是最高等級會員'}
          </span>
        </div>
        <div className="tier-progress-bar">
          <div className="tier-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="profile-form">
        <div className="profile-form-row">
          <div className="profile-field">
            <label>暱稱</label>
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
                目前無法在此修改
              </span>
            </label>
            <input
              type="email"
              className="apple-input"
              value={profileUser?.email || ''}
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
                目前由客服協助修改
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
            <option value="other">其他</option>
          </select>
        </div>

        <div>
          <button
            className="btn-blue profile-save-btn"
            onClick={handleUpdateProfile}
            disabled={isLoading || loading}
          >
            {isLoading || loading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
