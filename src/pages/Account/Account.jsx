import React, { useState, useEffect } from 'react'
import { Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ShoppingBag, Heart, MapPin, ShieldCheck,
  LogOut, ChevronRight, Check, Plus, Edit2, Trash2,
  Package, Truck, CheckCircle, XCircle, PawPrint, CreditCard
} from 'lucide-react'
import { useAuth, getMemberTier } from '../../context/AuthContext'
import './Account.css'


// ── Mock 訂單資料 ──
const MOCK_ORDERS = [
  {
    id: 'PL2026-0314',
    date: '2026-03-10',
    status: 'delivered',
    statusLabel: '已送達',
    total: 3560,
    items: [
      { name: 'Polar 主食罐', img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=200' },
      { name: 'Polar 益生菌', img: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=200' },
    ],
  },
  {
    id: 'PL2026-0298',
    date: '2026-02-28',
    status: 'processing',
    statusLabel: '處理中',
    total: 1280,
    items: [
      { name: 'Polar 主食罐', img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=200' },
    ],
  },
  {
    id: 'PL2026-0271',
    date: '2026-02-10',
    status: 'shipping',
    statusLabel: '配送中',
    total: 2130,
    items: [
      { name: 'Polar 零食', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200' },
      { name: 'Polar 主食罐', img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=200' },
    ],
  },
]


// ── Mock 收藏資料 ──
const MOCK_FAVORITES = [
  { id: 1, name: 'Polar 主食罐 - 鮮鮭魚', price: 1280, img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300' },
  { id: 2, name: 'Polar 益生菌化毛膏', price: 850, img: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=300' },
  { id: 3, name: 'Polar 凍乾零食 - 雞肉', price: 460, img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300' },
]

// ── Mock 信用卡資料 ──
const MOCK_CARDS = [
  { id: 1, brand: 'Visa', last4: '4242', expiry: '12/27', isDefault: true },
  { id: 2, brand: 'Mastercard', last4: '8888', expiry: '08/26', isDefault: false },
]

// ── 信用卡品牌 Logo（文字版）──
const CardBrandBadge = ({ brand }) => {
  const styles = {
    Visa: { background: '#1a1f71', color: '#fff' },
    Mastercard: { background: '#eb001b', color: '#fff' },
    JCB: { background: '#003087', color: '#fff' },
  }
  const s = styles[brand] || { background: '#6b7280', color: '#fff' }
  return (
    <span style={{
      ...s,
      fontSize: 11, fontWeight: 700, padding: '2px 8px',
      borderRadius: 4, letterSpacing: '0.04em', flexShrink: 0,
    }}>
      {brand}
    </span>
  )
}


// ── 狀態 Icon ──
const StatusIcon = ({ status }) => {
  const map = {
    delivered: <CheckCircle size={12} />,
    processing: <Package size={12} />,
    shipping: <Truck size={12} />,
    cancelled: <XCircle size={12} />,
  }
  return map[status] || null
}


// ── Toast 通知 ──
const Toast = ({ message }) => (
  <motion.div
    className="account-toast"
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20 }}
  >
    <Check size={16} color="#4ade80" />
    {message}
  </motion.div>
)


// ── Tab 定義 ──
const TABS = [
  { key: 'profile', label: '個人資料', icon: User, path: '/account' },
  { key: 'orders', label: '我的訂單', icon: ShoppingBag, path: '/orders' },
  { key: 'favorites', label: '收藏清單', icon: Heart, path: '/favorites' },
  { key: 'addresses', label: '地址管理', icon: MapPin, path: '/account' },
  { key: 'cards', label: '信用卡管理', icon: CreditCard, path: '/account' },  // ← 新增
  { key: 'security', label: '帳號安全', icon: ShieldCheck, path: '/account' },
]


const Account = () => {
  const { user, isLoading, logout, updateProfile, changePassword, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [activeTab, setActiveTab] = useState('profile')
  const [toast, setToast] = useState('')

  // ── URL 同步 activeTab ──
  useEffect(() => {
    if (location.pathname === '/orders') {
      setActiveTab('orders')
    } else if (location.pathname === '/favorites') {
      setActiveTab('favorites')
    } else if (location.pathname === '/account') {
      setActiveTab(prev =>
        ['profile', 'addresses', 'cards', 'security'].includes(prev) ? prev : 'profile'
      )
    }
  }, [location.pathname])

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    birthday: user?.birthday || '',   // 修改①：保留顯示但改為 disabled
    gender: user?.gender || '',
  })

  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [favorites, setFavorites] = useState(MOCK_FAVORITES)
  const [cards, setCards] = useState(MOCK_CARDS)           // 修改②：信用卡 state

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: '/account' }} replace />
  }

  const tier = getMemberTier(user?.points || 0)
  const nextTierPoints =
    user?.points >= 8000 ? null :
      user?.points >= 3000 ? 8000 :
        user?.points >= 1000 ? 3000 : 1000
  const progressPct = nextTierPoints
    ? Math.min((user?.points / nextTierPoints) * 100, 100)
    : 100

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSaveProfile = () => {
    updateProfile(profileForm)
    showToast('個人資料已更新 ✓')
  }

  const handleChangePassword = async () => {
    if (!passwordForm.old || !passwordForm.new || !passwordForm.confirm) {
      setPasswordError('所有欄位都是必填的'); return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('新密碼與確認密碼不一致'); return
    }
    if (passwordForm.new.length < 8) {
      setPasswordError('新密碼至少 8 個字元'); return
    }
    const result = await changePassword(passwordForm.old, passwordForm.new)
    if (result.success) {
      setPasswordForm({ old: '', new: '', confirm: '' })
      setPasswordError('')
      showToast('密碼已更新 ✓')
    } else {
      setPasswordError(result.message)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleNavClick = (tab) => {
    if (tab.key === 'orders') {
      navigate('/orders')
    } else if (tab.key === 'favorites') {
      navigate('/favorites')
    } else {
      navigate('/account')
      setActiveTab(tab.key)
    }
  }

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  }

  const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : 'PL'


  // ── 各 Tab 內容 ──
  const renderContent = () => {
    switch (activeTab) {


      // ── 個人資料 ──
      case 'profile': return (
        <motion.div key="profile" {...fadeUp}>
          <h2 className="account-section-title">
            <User size={22} className="account-nav-icon" />個人資料
          </h2>

          <div className="tier-progress-section">
            <div className="tier-progress-label">
              <span>目前點數：<strong style={{ color: 'var(--color-brand-coffee)' }}>{(user?.points || 0).toLocaleString()} 點</strong></span>
              {nextTierPoints && (
                <span>距下一等級還差 {(nextTierPoints - user?.points).toLocaleString()} 點</span>
              )}
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
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="profile-field">
                <label>手機號碼</label>
                <input
                  type="tel"
                  className="apple-input"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-field">
                <label>
                  電子郵件
                  <span style={{
                    marginLeft: 8, fontSize: 11, fontWeight: 500,
                    color: 'var(--color-gray-dark)',
                    background: 'var(--color-bg-light)',
                    border: '1px solid var(--color-gray-light)',
                    borderRadius: 980, padding: '1px 8px',
                  }}>
                    如需變更，請洽服務人員
                  </span>
                </label>
                <input
                  type="email"
                  className="apple-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}  // ← 加上 cursor: not-allowed
                />
              </div>

              {/* 修改①：生日改為 disabled，不可編輯 */}
              <div className="profile-field">
                <label>
                  生日
                  <span style={{
                    marginLeft: 8, fontSize: 11, fontWeight: 500,
                    color: 'var(--color-gray-dark)',
                    background: 'var(--color-bg-light)',
                    border: '1px solid var(--color-gray-light)',
                    borderRadius: 980, padding: '1px 8px',
                  }}>
                    不可變更
                  </span>
                </label>
                <input
                  type="date"
                  className="apple-input"
                  value={profileForm.birthday}
                  disabled                          // ← 關鍵：設為唯讀
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="profile-field" style={{ maxWidth: 300 }}>
              <label>性別</label>
              <select
                className="apple-input select-input"
                value={profileForm.gender}
                onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
              >
                <option value="">請選擇</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">不願透露</option>
              </select>
            </div>

            <div>
              <button
                className="btn-blue profile-save-btn"
                onClick={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>

          {user?.pets?.length > 0 && (
            <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--color-gray-light)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PawPrint size={18} color="var(--color-brand-coffee)" />
                毛孩資料
              </h3>
              {user.pets.map((pet, i) => (
                <div key={i} style={{
                  background: 'var(--color-bg-light)', borderRadius: 14,
                  padding: '16px 20px', marginBottom: 10,
                  border: '1px solid var(--color-gray-light)',
                  display: 'flex', alignItems: 'center', gap: 16
                }}>
                  <span style={{ fontSize: 32 }}>
                    {pet.petType === 'cat' ? '🐱' : pet.petType === 'dog' ? '🐶' : pet.petType === 'rabbit' ? '🐰' : '🐾'}
                  </span>
                  <div>
                    <strong style={{ fontSize: 15, color: 'var(--color-text-dark)', display: 'block' }}>
                      {pet.petName || `毛孩 ${i + 1}`}
                    </strong>
                    <span style={{ fontSize: 13, color: 'var(--color-gray-dark)' }}>
                      {[pet.petBreed || pet.petType, pet.petAge && `${pet.petAge} 歲`, pet.petWeight && `${pet.petWeight} kg`]
                        .filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )


      // ── 訂單 ──
      case 'orders': return (
        <motion.div key="orders" {...fadeUp}>
          <h2 className="account-section-title">
            <ShoppingBag size={22} className="account-nav-icon" />我的訂單
          </h2>
          {MOCK_ORDERS.length === 0 ? (
            <div className="account-empty-state">
              <div className="account-empty-icon">📦</div>
              <h3>還沒有任何訂單</h3>
              <p>立即探索 Polar 精選商品</p>
              <Link to="/products" className="btn-blue"
                style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 980, textDecoration: 'none', fontSize: 15 }}>
                開始購物
              </Link>
            </div>
          ) : (
            <div className="order-list">
              {MOCK_ORDERS.map(order => (
                <div className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <div>
                      <div className="order-id">訂單 {order.id}</div>
                      <div className="order-date">{order.date}</div>
                    </div>
                    <span className={`order-status-badge ${order.status}`}>
                      <StatusIcon status={order.status} />
                      {order.statusLabel}
                    </span>
                  </div>
                  <div className="order-card-body">
                    <div className="order-items-preview">
                      {order.items.map((item, i) => (
                        <img key={i} src={item.img} alt={item.name} className="order-item-img" />
                      ))}
                    </div>
                    <div className="order-info">
                      <div className="order-total">NT${order.total.toLocaleString()}</div>
                      <div className="order-item-count">{order.items.length} 件商品</div>
                    </div>
                    <div className="order-actions">
                      <button className="btn-order-action">查看明細</button>
                      {order.status === 'delivered' && (
                        <button className="btn-order-action primary">再次購買</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )


      // ── 收藏 ──
      case 'favorites': return (
        <motion.div key="favorites" {...fadeUp}>
          <h2 className="account-section-title">
            <Heart size={22} className="account-nav-icon" />收藏清單
          </h2>
          {favorites.length === 0 ? (
            <div className="account-empty-state">
              <div className="account-empty-icon">🐾</div>
              <h3>收藏清單是空的</h3>
              <p>收藏您喜歡的商品，方便隨時購買</p>
              <Link to="/products" className="btn-blue"
                style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 980, textDecoration: 'none', fontSize: 15 }}>
                探索商品
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              {favorites.map(item => (
                <div key={item.id}
                  style={{ borderRadius: 16, border: '1px solid var(--color-gray-light)', overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px var(--color-shadow-light)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={item.img} alt={item.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                    <button onClick={() => setFavorites(f => f.filter(i => i.id !== item.id))}
                      style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e74c3c' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 4, lineHeight: 1.3 }}>{item.name}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-brand-coffee)' }}>NT${item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )


      // ── 地址管理 ──
      case 'addresses': return (
        <motion.div key="addresses" {...fadeUp}>
          <h2 className="account-section-title">
            <MapPin size={22} className="account-nav-icon" />地址管理
          </h2>
          <div className="address-grid">
            {(user?.addresses || []).map(addr => (
              <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                {addr.isDefault && <span className="address-default-badge">預設</span>}
                <div className="address-label">🏠 {addr.label}</div>
                <div className="address-name">{addr.name}</div>
                <div className="address-detail">
                  {addr.phone}<br />{addr.city}{addr.district}<br />{addr.address}
                </div>
                <div className="address-actions">
                  <button className="btn-address-action">
                    <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />編輯
                  </button>
                  {!addr.isDefault && <button className="btn-address-action">設為預設</button>}
                  {!addr.isDefault && (
                    <button className="btn-address-action" style={{ color: '#e74c3c' }}>
                      <Trash2 size={12} style={{ display: 'inline' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button className="btn-add-address" onClick={() => showToast('地址新增功能開發中')}>
              <Plus size={24} />新增地址
            </button>
          </div>
        </motion.div>
      )


      // ── 修改②：信用卡管理（全新 Tab）──
      case 'cards': return (
        <motion.div key="cards" {...fadeUp}>
          <h2 className="account-section-title">
            <CreditCard size={22} className="account-nav-icon" />信用卡管理
          </h2>

          <div className="address-grid">
            {cards.map(card => (
              <div key={card.id} className={`address-card ${card.isDefault ? 'default' : ''}`}
                style={{ cursor: 'default' }}>
                {card.isDefault && <span className="address-default-badge">預設</span>}

                {/* 卡片頂部：品牌 + 末四碼 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <CardBrandBadge brand={card.brand} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-dark)', letterSpacing: '0.08em' }}>
                    •••• {card.last4}
                  </span>
                </div>

                {/* 有效期限 */}
                <div style={{ fontSize: 13, color: 'var(--color-gray-dark)', marginBottom: 16 }}>
                  有效期限：{card.expiry}
                </div>

                {/* 操作按鈕 */}
                <div className="address-actions">
                  {!card.isDefault && (
                    <button
                      className="btn-address-action"
                      onClick={() => {
                        setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === card.id })))
                        showToast('已設為預設信用卡 ✓')
                      }}
                    >
                      設為預設
                    </button>
                  )}
                  <button
                    className="btn-address-action"
                    style={{ color: '#e74c3c' }}
                    onClick={() => {
                      if (window.confirm(`確定要刪除 ${card.brand} •••• ${card.last4} 嗎？`)) {
                        setCards(prev => prev.filter(c => c.id !== card.id))
                        showToast('信用卡已刪除')
                      }
                    }}
                  >
                    <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} />刪除
                  </button>
                </div>
              </div>
            ))}

            {/* 新增信用卡按鈕 */}
            <button className="btn-add-address" onClick={() => showToast('新增信用卡功能開發中')}>
              <Plus size={24} />新增信用卡
            </button>
          </div>

          {/* 安全說明 */}
          <p style={{
            marginTop: 24, fontSize: 12, color: 'var(--color-gray-dark)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🔒 您的信用卡資訊經過 SSL 加密保護，Polar 不會儲存完整卡號
          </p>
        </motion.div>
      )


      // ── 帳號安全 ──
      case 'security': return (
        <motion.div key="security" {...fadeUp}>
          <h2 className="account-section-title">
            <ShieldCheck size={22} className="account-nav-icon" />帳號安全
          </h2>
          <div className="security-section">
            <div className="security-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="security-item-info" style={{ marginBottom: 20 }}>
                <h4>修改密碼</h4>
                <p>定期更換密碼以保護帳號安全</p>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
                {['old', 'new', 'confirm'].map((field, i) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>
                      {['舊密碼', '新密碼（至少 8 碼）', '確認新密碼'][i]}
                    </label>
                    <input
                      type="password"
                      className="apple-input"
                      value={passwordForm[field]}
                      onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                {passwordError && (
                  <p style={{ fontSize: 13, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {passwordError}
                  </p>
                )}
                <button className="btn-blue"
                  style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 980, fontSize: 15 }}
                  onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading ? '更新中...' : '更新密碼'}
                </button>
              </div>
            </div>

            <div className="security-item">
              <div className="security-item-info">
                <h4>雙重驗證</h4>
                <p>啟用簡訊驗證碼保護帳號安全</p>
              </div>
              <button className="btn-order-action" onClick={() => showToast('雙重驗證功能開發中')}>
                開啟設定 <ChevronRight size={14} style={{ display: 'inline' }} />
              </button>
            </div>

            <div className="security-item" style={{ borderColor: '#fee2e2' }}>
              <div className="security-item-info">
                <h4 style={{ color: '#e74c3c' }}>刪除帳號</h4>
                <p>此操作無法復原，所有資料將被永久刪除</p>
              </div>
              <button
                onClick={() => window.confirm('確定要刪除帳號嗎？此操作無法復原。') && handleLogout()}
                style={{ padding: '8px 16px', borderRadius: 980, border: '1.5px solid #e74c3c', background: 'transparent', color: '#e74c3c', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                刪除帳號
              </button>
            </div>
          </div>
        </motion.div>
      )


      default: return null
    }
  }


  return (
    <div className="account-page">
      <div className="account-mobile-tabs">
        {TABS.map(tab => (
          <button key={tab.key}
            className={`account-mobile-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleNavClick(tab)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="account-layout">
        <div className="account-sidebar">
          <div className="account-profile-card">
            <div className="account-avatar">
              {user?.avatar ? <img src={user.avatar} alt={user.name} /> : getInitials(user?.name)}
            </div>
            <div className="account-user-name">{user?.name}</div>
            <div className="account-user-email">{user?.email}</div>
            <div className="account-tier-badge" style={{ color: tier.color, backgroundColor: tier.bg }}>
              ⭐ {tier.label}
            </div>
            <div className="account-points-row">
              <span>我的點數</span>
              <span className="account-points-value">{(user?.points || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="account-nav">
            {TABS.map(({ key, label, icon: Icon, path }) => (
              <button key={key}
                className={`account-nav-item ${activeTab === key ? 'active' : ''}`}
                onClick={() => handleNavClick({ key, label, icon: Icon, path })}>
                <Icon size={16} className="account-nav-icon" />
                {label}
                {activeTab === key && (
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-brand-blue)' }} />
                )}
              </button>
            ))}
            <button className="account-nav-item logout-btn" onClick={handleLogout}>
              <LogOut size={16} className="account-nav-icon" />
              登出帳號
            </button>
          </div>
        </div>

        <div className="account-content">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast} onClose={() => setToast('')} />}
      </AnimatePresence>
    </div>
  )
}

export default Account
