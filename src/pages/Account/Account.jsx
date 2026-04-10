import { Suspense, lazy } from 'react'
import { Navigate } from 'react-router-dom'
import {
  User,
  Package,
  Heart,
  MapPin,
  PawPrint,
  RefreshCw,
  Shield,
} from 'lucide-react'

import { useAuth } from '../../context/useAuth'
import { useAccountTab } from '../../modules/account/hooks/useAccountTab'
import { SEOHead, LoadingSpinner } from '../../components/common'
import AccountSubscription from './tabs/AccountSubscription'
import './Account.css'

const AccountProfile = lazy(() => import('../../modules/account/components/AccountProfile'))
const AccountOrders = lazy(() => import('../../modules/account/components/AccountOrders'))
const AccountFavorites = lazy(() => import('../../modules/account/components/AccountFavorites'))
const AccountAddresses = lazy(() => import('../../modules/account/components/AccountAddresses'))
const AccountPets = lazy(() => import('../../modules/account/components/AccountPets'))
const AccountSecurity = lazy(() => import('../../modules/account/components/AccountSecurity'))

const TAB_CONFIG = [
  { key: 'profile', label: '會員資料', icon: User, component: AccountProfile },
  { key: 'orders', label: '訂單紀錄', icon: Package, component: AccountOrders },
  { key: 'subscription', label: '訂閱服務', icon: RefreshCw, component: AccountSubscription },
  { key: 'favorites', label: '收藏商品', icon: Heart, component: AccountFavorites },
  { key: 'addresses', label: '收件地址', icon: MapPin, component: AccountAddresses },
  { key: 'pets', label: '毛孩資料', icon: PawPrint, component: AccountPets },
  { key: 'security', label: '帳號安全', icon: Shield, component: AccountSecurity },
]

export default function Account() {
  const { user } = useAuth()
  const { activeTab, switchTab } = useAccountTab()

  if (!user) return <Navigate to="/login" replace />

  const ActiveComponent = TAB_CONFIG.find(
    (tab) => tab.key === activeTab,
  )?.component ?? AccountProfile

  return (
    <main className="account-page">
      <SEOHead title="會員中心" noIndex={true} />

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

      <div className="account-profile-card account-profile-card-mobile">
        <div className="account-avatar">
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} />
            : <span>{user?.name?.[0] ?? '會'}</span>}
        </div>
        <div className="account-user-name">{user?.name}</div>
        <div className="account-user-email">{user?.email}</div>
      </div>

      <div className="account-layout">
        <aside className="account-sidebar">
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
        </aside>

        <div className="account-content">
          <Suspense fallback={<LoadingSpinner size="large" />}>
            <ActiveComponent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
