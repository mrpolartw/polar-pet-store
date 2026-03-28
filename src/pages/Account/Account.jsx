import { Suspense, lazy } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  User, Package, Heart, MapPin,
  PawPrint, RefreshCw, Shield, LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { getMemberTier } from '../../context/authUtils'
import { useAccountTab } from '../../modules/account/hooks/useAccountTab'
import { SEOHead, LoadingSpinner } from '../../components/common'
import AccountSubscription from './tabs/AccountSubscription'
import './Account.css'

const AccountProfile  = lazy(() => import('../../modules/account/components/AccountProfile'))
const AccountOrders   = lazy(() => import('../../modules/account/components/AccountOrders'))
const AccountFavorites = lazy(() => import('../../modules/account/components/AccountFavorites'))
const AccountAddresses = lazy(() => import('../../modules/account/components/AccountAddresses'))
const AccountPets     = lazy(() => import('../../modules/account/components/AccountPets'))
const AccountSecurity = lazy(() => import('../../modules/account/components/AccountSecurity'))

const TAB_CONFIG = [
  { key: 'profile',      label: '個人資料', icon: User,      component: AccountProfile },
  { key: 'orders',       label: '我的訂單', icon: Package,   component: AccountOrders },
  { key: 'subscription', label: '月訂管理', icon: RefreshCw, component: AccountSubscription },
  { key: 'favorites',    label: '收藏商品', icon: Heart,     component: AccountFavorites },
  { key: 'addresses',    label: '地址管理', icon: MapPin,    component: AccountAddresses },
  { key: 'pets',         label: '我的毛孩', icon: PawPrint,  component: AccountPets },
  { key: 'security',     label: '帳號安全', icon: Shield,    component: AccountSecurity },
]

export default function Account() {
  const { user, logout } = useAuth()
  const { activeTab, switchTab } = useAccountTab()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />

  const tier = getMemberTier(user?.points || 0)
  const ActiveComponent = TAB_CONFIG.find((tab) => tab.key === activeTab)?.component ?? AccountProfile

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <SEOHead title="會員中心 | Polar 寵物食品" />
      <div className="account-page">

        {/* 手機版橫向 tab 列 */}
        <div className="account-mobile-tabs">
          {TAB_CONFIG.map(({ key, label }) => (
            <button
              key={key}
              className={`account-mobile-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => switchTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 手機版個人資訊卡片 */}
        <div className="account-profile-card account-profile-card-mobile">
          <div className="account-avatar">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} />
              : <span>{user?.name?.[0] ?? '?'}</span>}
          </div>
          <div className="account-user-name">{user?.name}</div>
          <div className="account-user-email">{user?.email}</div>
        </div>

        <div className="account-layout">
          {/* 左側 Sidebar */}
          <aside className="account-sidebar">
            <div className="account-profile-card">
              <div className="account-avatar">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} />
                  : <span>{user?.name?.[0] ?? '?'}</span>}
              </div>
              <div className="account-user-name">{user?.name}</div>
              <div className="account-user-email">{user?.email}</div>
              {tier && (
                <span
                  className="account-tier-badge"
                  style={{ background: tier.bg, color: tier.color }}
                >
                  {tier.label}
                </span>
              )}
            </div>

            <nav className="account-nav">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.key}
                  className={`account-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => switchTab(tab.key)}
                  aria-current={activeTab === tab.key ? 'page' : undefined}
                >
                  <tab.icon size={18} strokeWidth={1.5} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <button
              className="account-nav-item"
              style={{ color: '#e74c3c', marginTop: 8 }}
              onClick={handleLogout}
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span>登出</span>
            </button>
          </aside>

          {/* 主要內容區 */}
          <div className="account-content">
            <Suspense fallback={<LoadingSpinner size="large" />}>
              <ActiveComponent />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}
