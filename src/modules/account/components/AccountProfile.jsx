import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import { CONFIG } from '../../../constants/config'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'
import AccountMembershipSummary from './AccountMembershipSummary'
import AccountPointHistory from './AccountPointHistory'
import {
  formatMembershipPoints,
  getMembershipLevelName,
} from '../../membership/utils'

const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AVATAR_FILE_SIZE = CONFIG.MAX_AVATAR_SIZE ?? 5 * 1024 * 1024
const MAX_AVATAR_SIZE_MB = Math.round(MAX_AVATAR_FILE_SIZE / 1024 / 1024)

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'PL')

function AccountProfileCard({
  user,
  membershipSummary,
  onAvatarUpload,
}) {
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
        {user?.avatar ? (
          <img src={user.avatar} alt={user?.name || '會員頭像'} />
        ) : (
          getInitials(user?.name)
        )}
        <span className="account-avatar-overlay">
          <Camera size={18} />
        </span>
      </button>

      <div className="account-user-name">{user?.name ?? '會員'}</div>
      <div className="account-user-email">{user?.email ?? '尚未提供 Email'}</div>

      <div className="account-tier-badge">
        <span>{getMembershipLevelName(membershipSummary?.currentLevel)}</span>
      </div>

      <div className="account-points-row">
        <span>可用點數</span>
        <span className="account-points-value">
          {formatMembershipPoints(membershipSummary?.availablePoints)}
        </span>
      </div>
    </div>
  )
}

export default function AccountProfile() {
  const {
    user,
    updateProfile,
    isLoading,
    membershipSummary,
    isMembershipLoading,
    membershipError,
    refreshMembership,
  } = useAuth()
  const toast = useToast()
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    birthday: user?.birthday || '',
    gender: user?.gender || 'undisclosed',
  })

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      birthday: user?.birthday || '',
      gender: user?.gender || 'undisclosed',
    })
  }, [user?.birthday, user?.gender, user?.name, user?.phone])

  const handleUpdateProfile = async () => {
    try {
      const result = await updateProfile(profileForm)

      if (result?.success === false) {
        throw new Error(result?.message || '資料更新失敗，請稍後再試')
      }

      toast.success('會員資料已儲存')
      await refreshMembership()
    } catch (err) {
      toast.error(err?.message || '資料更新失敗，請稍後再試')
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
        toast.error(err?.message || '頭像更新失敗，請稍後再試')
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
        會員中心
      </h2>

      <AccountProfileCard
        user={user}
        membershipSummary={membershipSummary}
        onAvatarUpload={handleAvatarUpload}
      />

      <AccountMembershipSummary
        summary={{
          ...membershipSummary,
          customerSince: user?.memberSince,
        }}
        isLoading={isMembershipLoading}
        error={membershipError}
        onRetry={refreshMembership}
      />

      <AccountPointHistory logs={membershipSummary?.recentPointLogs ?? []} />

      <div className="profile-form" style={{ marginTop: 32 }}>
        <div className="profile-form-row">
          <div className="profile-field">
            <label>姓名</label>
            <input
              type="text"
              className="apple-input"
              value={profileForm.name}
              onChange={(event) => {
                setProfileForm((prev) => ({ ...prev, name: event.target.value }))
              }}
            />
          </div>

          <div className="profile-field">
            <label>手機</label>
            <input
              type="tel"
              className="apple-input"
              value={profileForm.phone}
              onChange={(event) => {
                setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
              }}
            />
          </div>
        </div>

        <div className="profile-form-row">
          <div className="profile-field">
            <label>Email</label>
            <input
              type="email"
              className="apple-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="profile-field">
            <label>生日</label>
            <input
              type="date"
              className="apple-input"
              value={profileForm.birthday}
              onChange={(event) => {
                setProfileForm((prev) => ({ ...prev, birthday: event.target.value }))
              }}
            />
          </div>
        </div>

        <div className="profile-field" style={{ maxWidth: 320 }}>
          <label>性別</label>
          <select
            className="apple-input select-input"
            value={profileForm.gender}
            onChange={(event) => {
              setProfileForm((prev) => ({ ...prev, gender: event.target.value }))
            }}
          >
            <option value="undisclosed">未透露</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </div>

        <div>
          <button
            className="btn-blue profile-save-btn"
            onClick={handleUpdateProfile}
            disabled={isLoading}
          >
            {isLoading ? '儲存中...' : '儲存資料'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
