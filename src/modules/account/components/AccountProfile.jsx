import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import { CONFIG } from '../../../constants/config'
import { useAuth } from '../../../context/useAuth'
import { getMemberTier } from '../../../context/authUtils'
import { useToast } from '../../../context/ToastContext'
import { useMember, useTiers } from '../../../hooks/useMember'

const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AVATAR_FILE_SIZE = CONFIG.MAX_AVATAR_SIZE ?? 5 * 1024 * 1024
const MAX_AVATAR_SIZE_MB = Math.round(MAX_AVATAR_FILE_SIZE / 1024 / 1024)

const FALLBACK_SPENDING_TIERS = [
  { tier_key: 'basic', tier_name: '一般會員', tier_color: '#8A7E71', upgrade_min_spending: 0, sort_order: 10 },
  { tier_key: 'silver', tier_name: '銀卡會員', tier_color: '#6B7280', upgrade_min_spending: 6000, sort_order: 20 },
  { tier_key: 'gold', tier_name: '金卡會員', tier_color: '#8B5A2B', upgrade_min_spending: 30000, sort_order: 30 },
  { tier_key: 'black', tier_name: '黑卡會員', tier_color: '#1F2937', upgrade_min_spending: 60000, sort_order: 40 },
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'PL')

const normalizeTierKey = (value) => {
  const key = String(value || '').trim().toLowerCase()

  if (!key) return ''
  if (['member', 'family', 'general', 'default'].includes(key)) return 'basic'
  if (['diamond'].includes(key)) return 'black'

  return key
}

const normalizeTierName = (value) => String(value || '').trim()

const formatCurrency = (value) => `NT$${Math.max(0, Math.round(Number(value) || 0)).toLocaleString()}`

const buildTierPalette = (tierColor, fallbackTier) => ({
  ...fallbackTier,
  color: tierColor || fallbackTier.color,
})

const resolveTierList = (tiers) => {
  const rows = Array.isArray(tiers) && tiers.length > 0 ? tiers : FALLBACK_SPENDING_TIERS

  return [...rows]
    .map((tier, index) => ({
      tier_key: normalizeTierKey(tier.tier_key || tier.key),
      tier_name: normalizeTierName(tier.tier_name || tier.name),
      tier_color: tier.tier_color || tier.color || FALLBACK_SPENDING_TIERS[index]?.tier_color || '#8A7E71',
      upgrade_min_spending: Number(tier.upgrade_min_spending || 0),
      sort_order: Number(tier.sort_order || (index + 1) * 10),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
}

const resolveCurrentTier = (member, tierList, yearlySpending) => {
  const currentTierKey = normalizeTierKey(member?.tier_key || member?.tier?.key || member?.tierKey)
  const currentTierName = normalizeTierName(member?.tier_name || member?.tier?.name || member?.tierName)

  if (currentTierKey) {
    const foundByKey = tierList.find((tier) => tier.tier_key === currentTierKey)
    if (foundByKey) return foundByKey
  }

  if (currentTierName) {
    const foundByName = tierList.find((tier) => tier.tier_name === currentTierName)
    if (foundByName) return foundByName
  }

  const qualified = tierList.filter((tier) => yearlySpending >= Number(tier.upgrade_min_spending || 0))
  return qualified.at(-1) || tierList[0] || null
}

function AccountProfileCard({ user, tier, onAvatarUpload, statusText }) {
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
      <div className="account-user-name">{`您好，${user?.name ?? '會員'}`}</div>
      <div className="account-user-email">{statusText || user?.email || ''}</div>
      <div className="account-tier-badge" style={{ background: tier.bg, color: tier.color }}>
        <span>會員等級 {tier.label}</span>
      </div>
      <div className="account-points-row">
        <span>會員點數</span>
        <span className="account-points-value">
          {user?.points || 0}
        </span>
      </div>
    </div>
  )
}

export default function AccountProfile() {
  const { user, isLoading } = useAuth()
  const { member, loading, error, updateMember } = useMember()
  const { tiers } = useTiers()
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

  const profileUser = useMemo(() => ({
    ...user,
    name: member?.display_name || user?.name || '',
    email: member?.email || user?.email || '',
    phone: member?.phone || user?.phone || '',
    birthday: member?.birthday || user?.birthday || '',
    gender: member?.gender || user?.gender || '',
    avatar: member?.avatar_url || profileForm.avatar || user?.avatar || '',
    points: Number(member?.points_balance ?? user?.points ?? 0),
    yearlySpending: Number(member?.yearly_spending ?? user?.yearlySpending ?? 0),
    tierName: member?.tier_name || member?.tier?.name || user?.tierName || '',
    tierColor: member?.tier_color || member?.tier?.color || user?.tierColor || '',
    tierKey: member?.tier_key || member?.tier?.key || user?.tierKey || '',
  }), [member, profileForm.avatar, user])

  const fallbackTier = getMemberTier(profileUser?.points || 0)
  const displayTier = buildTierPalette(profileUser?.tierColor, {
    ...fallbackTier,
    label: profileUser?.tierName || fallbackTier.label,
  })

  const spendingProgress = useMemo(() => {
    const yearlySpending = Number(profileUser?.yearlySpending || 0)
    const tierList = resolveTierList(tiers)
    const currentTier = resolveCurrentTier(profileUser, tierList, yearlySpending)

    if (!currentTier) {
      return {
        currentTierName: displayTier.label,
        nextTierName: '',
        yearlySpending,
        progressPct: 0,
        progressTitle: displayTier.label,
        progressValue: formatCurrency(yearlySpending),
        remainingLabel: '尚未取得升級門檻資料',
      }
    }

    const currentIndex = Math.max(tierList.findIndex((tier) => tier.tier_key === currentTier.tier_key), 0)
    const nextTier = tierList[currentIndex + 1] || null

    if (!nextTier) {
      return {
        currentTierName: currentTier.tier_name,
        nextTierName: '',
        yearlySpending,
        progressPct: 100,
        progressTitle: `${currentTier.tier_name} -> 最高等級`,
        progressValue: formatCurrency(yearlySpending),
        remainingLabel: '已是最高等級',
      }
    }

    const currentThreshold = Number(currentTier.upgrade_min_spending || 0)
    const nextThreshold = Number(nextTier.upgrade_min_spending || 0)
    const thresholdRange = Math.max(nextThreshold - currentThreshold, 1)
    const progressPct = Math.min(
      Math.max(((yearlySpending - currentThreshold) / thresholdRange) * 100, 0),
      100
    )
    const remaining = Math.max(nextThreshold - yearlySpending, 0)

    return {
      currentTierName: currentTier.tier_name,
      nextTierName: nextTier.tier_name,
      yearlySpending,
      progressPct,
      progressTitle: `${currentTier.tier_name} -> ${nextTier.tier_name}`,
      progressValue: `${formatCurrency(yearlySpending)} / ${formatCurrency(nextThreshold)}`,
      remainingLabel: `距離${nextTier.tier_name}還差 ${formatCurrency(remaining)}`,
    }
  }, [displayTier.label, profileUser, tiers])

  const statusText = error
    ? error
    : loading
      ? '會員資料載入中...'
      : (profileUser?.email || '')

  const handleUpdateProfile = async () => {
    try {
      await updateMember({
        display_name: profileForm.name,
        phone: profileForm.phone,
        gender: profileForm.gender,
        birthday: profileForm.birthday,
        avatar_url: profileForm.avatar,
      })
      toast.success('會員資料已更新')
    } catch (nextError) {
      toast.error(nextError?.message || '更新失敗，請稍後再試')
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
          throw new Error('圖片讀取失敗')
        }

        await updateMember({ avatar_url: avatar })
        setProfileForm((prev) => ({ ...prev, avatar }))
        toast.success('頭像已更新')
      } catch (nextError) {
        toast.error(nextError?.message || '更新失敗，請稍後再試')
      }
    }

    reader.onerror = () => {
      toast.error('圖片讀取失敗')
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
        tier={displayTier}
        onAvatarUpload={handleAvatarUpload}
        statusText={statusText}
      />

      <div className="tier-progress-section">
        <div className="tier-progress-label">
          <span>
            <strong style={{ color: 'var(--color-brand-coffee)' }}>
              {spendingProgress.progressTitle}
            </strong>
          </span>
          <span>{spendingProgress.progressValue}</span>
        </div>
        <div
          className="tier-progress-label"
          style={{ marginTop: 6, fontSize: 13, color: 'var(--color-gray-dark)' }}
        >
          <span>{spendingProgress.remainingLabel}</span>
          <span />
        </div>
        <div className="tier-progress-bar">
          <div className="tier-progress-fill" style={{ width: `${spendingProgress.progressPct}%` }} />
        </div>
      </div>

      <div className="profile-form">
        <div className="profile-form-row">
          <div className="profile-field">
            <label>顯示名稱</label>
            <input
              type="text"
              className="apple-input"
              value={profileForm.name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="profile-field">
            <label>手機號碼</label>
            <input
              type="tel"
              className="apple-input"
              value={profileForm.phone}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
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
                目前不可修改
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
                目前不可修改
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
            onChange={(event) => setProfileForm((prev) => ({ ...prev, gender: event.target.value }))}
          >
            <option value="">請選擇</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">其他</option>
            <option value="prefer_not_to_say">不透露</option>
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
