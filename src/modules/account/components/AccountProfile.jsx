import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Camera, User } from 'lucide-react'

import { CONFIG } from '../../../constants/config'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'
import AccountMembershipSummary from './AccountMembershipSummary'
import AccountPointHistory from './AccountPointHistory'

const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AVATAR_FILE_SIZE = CONFIG.MAX_AVATAR_SIZE ?? 5 * 1024 * 1024
const MAX_AVATAR_SIZE_MB = Math.round(MAX_AVATAR_FILE_SIZE / 1024 / 1024)

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'PL')

function AccountProfileCard({ user, onAvatarUpload }) {
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

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span className="account-status-chip">
          {user?.emailVerified ? 'Email 已驗證' : 'Email 未驗證'}
        </span>
        {user?.lineLinked ? (
          <span
            className="account-status-chip"
            style={{ background: '#ECFDF3', color: '#15803D' }}
          >
            LINE 已綁定
          </span>
        ) : null}
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
      const result = await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || null,
        birthday: profileForm.birthday || null,
        gender: profileForm.gender || 'undisclosed',
      })

      if (result?.success === false) {
        throw new Error(result?.message || '會員資料更新失敗，請稍後再試。')
      }

      toast.success('會員資料已儲存。')
      await refreshMembership()
    } catch (err) {
      toast.error(err?.message || '會員資料更新失敗，請稍後再試。')
    }
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
      toast.error('頭像僅支援 JPG、PNG、WebP 或 GIF 格式。')
      return
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      toast.error(`頭像大小不可超過 ${MAX_AVATAR_SIZE_MB}MB。`)
      return
    }

    const reader = new FileReader()

    reader.onload = async () => {
      try {
        const avatar = typeof reader.result === 'string' ? reader.result : ''

        if (!avatar) {
          throw new Error('頭像讀取失敗，請重新選擇檔案。')
        }

        const result = await updateProfile({ avatar })

        if (result?.success === false) {
          throw new Error(result?.message || '頭像更新失敗，請稍後再試。')
        }

        toast.success('頭像已更新。')
      } catch (err) {
        toast.error(err?.message || '頭像更新失敗，請稍後再試。')
      }
    }

    reader.onerror = () => {
      toast.error('頭像讀取失敗，請重新選擇檔案。')
    }

    reader.readAsDataURL(file)
  }

  return (
    <motion.div key="profile" {...fadeUp}>
      <h2 className="account-section-title">
        <User size={22} className="account-nav-icon" />
        會員資料
      </h2>

      <AccountProfileCard user={user} onAvatarUpload={handleAvatarUpload} />

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
            <option value="undisclosed">不便透露</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 16,
            color: '#6e6e73',
            fontSize: 13,
          }}
        >
          <BadgeCheck size={16} color={user?.emailVerified ? '#16A34A' : '#F59E0B'} />
          <span>{user?.emailVerified ? 'Email 已完成驗證' : 'Email 尚未完成驗證'}</span>
        </div>

        <div>
          <button
            className="btn-blue profile-save-btn"
            onClick={handleUpdateProfile}
            disabled={isLoading}
          >
            {isLoading ? '儲存中...' : '儲存會員資料'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
