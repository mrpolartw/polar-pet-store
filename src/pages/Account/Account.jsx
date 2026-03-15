import React, { useState, useEffect } from 'react'
import { Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ShoppingBag, Heart, MapPin, ShieldCheck,
  LogOut, ChevronRight, Check, Plus, Edit2, Trash2,
  Package, Truck, CheckCircle, XCircle, PawPrint, CreditCard,
  Store, X, Lock,
} from 'lucide-react'
import { useAuth, getMemberTier } from '../../context/AuthContext'
import './Account.css'


// ─────────────────────────────────────────────
// 常數 & Mock 資料
// ─────────────────────────────────────────────
const MOCK_ORDERS = [
  {
    id: 'PL2026-0314', date: '2026-03-10', status: 'delivered', statusLabel: '已送達', total: 3560,
    items: [
      { name: 'Polar 主食罐', img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=200' },
      { name: 'Polar 益生菌', img: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=200' },
    ],
  },
  {
    id: 'PL2026-0298', date: '2026-02-28', status: 'processing', statusLabel: '處理中', total: 1280,
    items: [
      { name: 'Polar 主食罐', img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=200' },
    ],
  },
  {
    id: 'PL2026-0271', date: '2026-02-10', status: 'shipping', statusLabel: '配送中', total: 2130,
    items: [
      { name: 'Polar 零食', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200' },
      { name: 'Polar 主食罐', img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=200' },
    ],
  },
]

const MOCK_FAVORITES = [
  { id: 1, name: 'Polar 主食罐 - 鮮鮭魚', price: 1280, img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300' },
  { id: 2, name: 'Polar 益生菌化毛膏',     price: 850,  img: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=300' },
  { id: 3, name: 'Polar 凍乾零食 - 雞肉', price: 460,  img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300' },
]

const MOCK_CARDS = [
  { id: 1, brand: 'Visa',       last4: '4242', expiry: '12/27', holderName: 'WANG XIAOMING', isDefault: true },
  { id: 2, brand: 'Mastercard', last4: '8888', expiry: '08/26', holderName: 'WANG XIAOMING', isDefault: false },
]

const TW_CITIES = [
  '台北市','新北市','桃園市','台中市','台南市','高雄市',
  '基隆市','新竹市','嘉義市','新竹縣','苗栗縣','彰化縣',
  '南投縣','雲林縣','嘉義縣','屏東縣','宜蘭縣','花蓮縣',
  '台東縣','澎湖縣','金門縣','連江縣',
]

const EMPTY_ADDRESS_FORM = {
  type: 'home', label: '', name: '', phone: '',
  city: '', district: '', address: '',
  isDefault: false, storeName: '', storeId: '',
}

const EMPTY_CARD_FORM = {
  cardNumberRaw: '', holderName: '', expiryRaw: '', cvv: '', isDefault: false,
}

// ✅ 毛孩表單預設值
const EMPTY_PET_FORM = {
  petName: '', petGender: '', petType: '',
  petBreed: '', petAge: '', petWeight: '', petBirthday: '',
}

const TABS = [
  { key: 'profile',   label: '個人資料',   icon: User,        path: '/account' },
  { key: 'orders',    label: '我的訂單',   icon: ShoppingBag, path: '/orders' },
  { key: 'favorites', label: '收藏清單',   icon: Heart,       path: '/favorites' },
  { key: 'addresses', label: '地址管理',   icon: MapPin,      path: '/account' },
  { key: 'cards',     label: '信用卡管理', icon: CreditCard,  path: '/account' },
  { key: 'security',  label: '帳號安全',   icon: ShieldCheck, path: '/account' },
]

// ── 毛孩類型對應 Emoji ──
const PET_EMOJI = { cat: '🐱', dog: '🐶',other: '🐾' }
const PET_TYPE_LABEL = { cat: '貓咪', dog: '狗狗',other: '其他' }
const PET_GENDER_LABEL = { male: '男生', female: '女生' }


// ─────────────────────────────────────────────
// 工具函式（信用卡）
// ─────────────────────────────────────────────
const detectCardBrand = (num) => {
  const n = num.replace(/\s/g, '')
  if (/^4/.test(n))        return 'Visa'
  if (/^5[1-5]/.test(n))   return 'Mastercard'
  if (/^3[47]/.test(n))    return 'Amex'
  if (/^35/.test(n))       return 'JCB'
  return ''
}
const displayCardNumber = (raw) => raw.replace(/(.{4})/g, '$1 ').trim()
const displayExpiry     = (raw) => raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw
const parseExpiryRaw    = (fmt = '') => fmt.replace(/\D/g, '')


// ─────────────────────────────────────────────
// 小型子元件
// ─────────────────────────────────────────────
const BRAND_STYLES = {
  Visa:       { bg: '#1a1f71', color: '#fff', text: 'VISA' },
  Mastercard: { bg: 'linear-gradient(135deg,#eb001b,#f79e1b)', color: '#fff', text: 'MC' },
  Amex:       { bg: '#007bc1', color: '#fff', text: 'AMEX' },
  JCB:        { bg: '#003087', color: '#fff', text: 'JCB' },
}

const CardBrandBadge = ({ brand, size = 'sm' }) => {
  const s = BRAND_STYLES[brand] || { bg: '#6b7280', color: '#fff', text: brand || '???' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: size === 'lg' ? 13 : 11,
      fontWeight: 700,
      padding: size === 'lg' ? '4px 12px' : '2px 8px',
      borderRadius: 5, letterSpacing: '0.06em', flexShrink: 0,
    }}>
      {s.text}
    </span>
  )
}

const StatusIcon = ({ status }) => ({
  delivered:  <CheckCircle size={12} />,
  processing: <Package     size={12} />,
  shipping:   <Truck       size={12} />,
  cancelled:  <XCircle     size={12} />,
}[status] || null)

const Toast = ({ message }) => (
  <motion.div className="account-toast"
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0,  scale: 1 }}
    exit={{ opacity: 0, y: 20 }}>
    <Check size={16} color="#4ade80" />{message}
  </motion.div>
)


// ─────────────────────────────────────────────
// AddressModal（外部定義）
// ─────────────────────────────────────────────
const AddressModal = ({ show, onClose, addressForm, setAddressForm, editingAddressId, onSave, addressError, onToast }) => (
  <AnimatePresence>
    {show && (
      <>
        <motion.div className="address-modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} />
        <div className="address-modal-wrapper">
          <motion.div className="address-modal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}>

            <div className="address-modal-header">
              <h3 className="address-modal-title">{editingAddressId ? '編輯地址' : '新增地址'}</h3>
              <button className="address-modal-close" onClick={onClose}><X size={16} /></button>
            </div>

            <div className="address-type-grid">
              {[
                { key: 'home', label: '宅配到府',     desc: '寄送至您的住家或公司' },
                { key: '711', label: '7-11 超商取貨', desc: '串接 PayUni 選店' },
              ].map(opt => (
                <button key={opt.key}
                  className={`address-type-btn ${addressForm.type === opt.key ? 'active' : ''}`}
                  onClick={() => setAddressForm(p => ({ ...p, type: opt.key }))}>
                  <div className="address-type-btn-label">{opt.label}</div>
                  <div className="address-type-btn-desc">{opt.desc}</div>
                </button>
              ))}
            </div>

            {addressForm.type === 'home' && (
              <div className="address-form">
                <div>
                  <label className="address-form-label">地址標籤（選填）</label>
                  <div className="address-label-tags">
                    {['住家', '公司', '其他'].map(tag => (
                      <button key={tag}
                        className={`address-label-tag ${addressForm.label === tag ? 'active' : ''}`}
                        onClick={() => setAddressForm(p => ({ ...p, label: tag }))}>
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input type="text" className="apple-input" placeholder="自訂標籤（如：奶奶家）"
                    value={['住家', '公司', '其他'].includes(addressForm.label) ? '' : addressForm.label}
                    onChange={e => setAddressForm(p => ({ ...p, label: e.target.value }))} />
                </div>
                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">收件人姓名 *</label>
                    <input type="text" className="apple-input" placeholder="王小明"
                      value={addressForm.name}
                      onChange={e => setAddressForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="address-form-label">手機號碼 *</label>
                    <input type="tel" className="apple-input" placeholder="0912-345-678"
                      value={addressForm.phone}
                      onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">縣市 *</label>
                    <select className="apple-input select-input"
                      value={addressForm.city}
                      onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))}>
                      <option value="">請選擇縣市</option>
                      {TW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="address-form-label">行政區 *</label>
                    <input type="text" className="apple-input" placeholder="信義區"
                      value={addressForm.district}
                      onChange={e => setAddressForm(p => ({ ...p, district: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="address-form-label">詳細地址 *</label>
                  <input type="text" className="apple-input" placeholder="信義路五段7號3樓"
                    value={addressForm.address}
                    onChange={e => setAddressForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>
            )}

            {addressForm.type === '711' && (
              <div className="address-form">
                <div className="store-picker-box">
                  <Store size={28} color="var(--color-brand-coffee)" style={{ marginBottom: 8 }} />
                  {addressForm.storeName ? (
                    <>
                      <p className="store-picker-name">{addressForm.storeName}</p>
                      {addressForm.storeId && <p className="store-picker-id">門市代號：{addressForm.storeId}</p>}
                      <button className="store-picker-reselect" onClick={() => onToast('即將串接 PayUni 選店地圖')}>重新選擇門市</button>
                    </>
                  ) : (
                    <>
                      <p className="store-picker-desc">點擊下方按鈕，透過地圖選擇您附近的 7-11 門市</p>
                      <button className="btn-blue" style={{ padding: '10px 24px', borderRadius: 980, fontSize: 14 }}
                        onClick={() => {
                          setAddressForm(p => ({ ...p, storeName: '7-ELEVEN 信義門市（測試）', storeId: 'TEST001' }))
                          onToast('PayUni 選店功能串接中，已填入測試門市')
                        }}>
                        選擇 7-11 門市
                      </button>
                    </>
                  )}
                </div>
                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">收件人姓名 *</label>
                    <input type="text" className="apple-input" placeholder="王小明"
                      value={addressForm.name}
                      onChange={e => setAddressForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="address-form-label">手機號碼 *</label>
                    <input type="tel" className="apple-input" placeholder="0912-345-678"
                      value={addressForm.phone}
                      onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="store-notice">
                  <strong>溫馨提醒</strong>：請於取貨期限內完成取件。
                </div>
              </div>
            )}

            <label className="address-default-check">
              <input type="checkbox" checked={addressForm.isDefault}
                onChange={e => setAddressForm(p => ({ ...p, isDefault: e.target.checked }))} />
              設為預設收件地址
            </label>

            {addressError && <div className="address-form-error">⚠️ {addressError}</div>}

            <div className="address-modal-actions">
              <button className="btn-modal-cancel" onClick={onClose}>取消</button>
              <button className="btn-blue btn-modal-submit" onClick={onSave}>
                {editingAddressId ? '儲存變更' : '新增地址'}
              </button>
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
)


// ─────────────────────────────────────────────
// CardModal（外部定義）
// ─────────────────────────────────────────────
const CardModal = ({ show, onClose, cardForm, setCardForm, editingCardId, onSave, cardError }) => {
  const isEdit = !!editingCardId
  const detectedBrand = detectCardBrand(cardForm.cardNumberRaw || '')
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div className="address-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />
          <div className="address-modal-wrapper">
            <motion.div className="address-modal"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}>

              <div className="address-modal-header">
                <h3 className="address-modal-title">{isEdit ? '編輯信用卡' : '新增信用卡'}</h3>
                <button className="address-modal-close" onClick={onClose}><X size={16} /></button>
              </div>

              <div className="card-preview">
                <div className="card-preview-top">
                  {detectedBrand
                    ? <CardBrandBadge brand={detectedBrand} size="lg" />
                    : <CreditCard size={22} color="rgba(255,255,255,0.6)" />}
                  <Lock size={14} color="rgba(255,255,255,0.5)" />
                </div>
                <div className="card-preview-number">
                  {isEdit
                    ? `•••• •••• •••• ${cardForm.last4 || '????'}`
                    : (cardForm.cardNumberRaw ? displayCardNumber(cardForm.cardNumberRaw) : '•••• •••• •••• ••••')}
                </div>
                <div className="card-preview-bottom">
                  <div>
                    <div className="card-preview-label">持卡人</div>
                    <div className="card-preview-value">{cardForm.holderName || 'YOUR NAME'}</div>
                  </div>
                  <div>
                    <div className="card-preview-label">到期日</div>
                    <div className="card-preview-value">{displayExpiry(cardForm.expiryRaw || '') || 'MM/YY'}</div>
                  </div>
                </div>
              </div>

              <div className="address-form">
                {!isEdit && (
                  <div>
                    <label className="address-form-label">卡號 *</label>
                    <div style={{ position: 'relative' }}>
                      <input type="text" inputMode="numeric" className="apple-input"
                        placeholder="1234 5678 9012 3456" maxLength={19}
                        value={displayCardNumber(cardForm.cardNumberRaw)}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
                          setCardForm(p => ({ ...p, cardNumberRaw: raw }))
                        }}
                        style={{ paddingRight: detectedBrand ? 72 : 16 }} />
                      {detectedBrand && (
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                          <CardBrandBadge brand={detectedBrand} />
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {isEdit && (
                  <div>
                    <label className="address-form-label">卡號</label>
                    <input type="text" className="apple-input"
                      value={`•••• •••• •••• ${cardForm.last4}`} disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed', letterSpacing: '0.1em' }} />
                  </div>
                )}
                <div>
                  <label className="address-form-label">持卡人姓名 *</label>
                  <input type="text" className="apple-input" placeholder="WANG XIAOMING（英文大寫）"
                    value={cardForm.holderName}
                    onChange={e => {
                      const val = e.target.value.toUpperCase()
                      setCardForm(p => ({ ...p, holderName: val }))
                    }} />
                </div>
                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">到期日 *</label>
                    <input type="text" inputMode="numeric" className="apple-input"
                      placeholder="MM/YY" maxLength={5}
                      value={displayExpiry(cardForm.expiryRaw)}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setCardForm(p => ({ ...p, expiryRaw: raw }))
                      }} />
                  </div>
                  {!isEdit && (
                    <div>
                      <label className="address-form-label">
                        安全碼（CVV）*
                        <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--color-gray-dark)', fontWeight: 400 }}>
                          僅驗證，不儲存
                        </span>
                      </label>
                      <input type="password" inputMode="numeric" className="apple-input"
                        placeholder="•••" maxLength={4}
                        value={cardForm.cvv}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCardForm(p => ({ ...p, cvv: val }))
                        }} />
                    </div>
                  )}
                </div>
              </div>

              <label className="address-default-check">
                <input type="checkbox" checked={cardForm.isDefault}
                  onChange={e => {
                    const val = e.target.checked
                    setCardForm(p => ({ ...p, isDefault: val }))
                  }} />
                設為預設付款方式
              </label>

              <div className="card-security-notice">
                <Lock size={12} />
                您的卡片資訊透過 256-bit SSL 加密傳輸，Polar 不會儲存完整卡號與 CVV
              </div>

              {cardError && <div className="address-form-error">⚠️ {cardError}</div>}

              <div className="address-modal-actions">
                <button className="btn-modal-cancel" onClick={onClose}>取消</button>
                <button className="btn-blue btn-modal-submit" onClick={onSave}>
                  {isEdit ? '儲存變更' : '新增信用卡'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}


// ─────────────────────────────────────────────
// ✅ PetModal（外部定義，與 AddressModal / CardModal 相同架構）
// ─────────────────────────────────────────────
const PetModal = ({ show, onClose, petForm, setPetForm, editingPetId, onSave, petError }) => (
  <AnimatePresence>
    {show && (
      <>
        <motion.div className="address-modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} />
        <div className="address-modal-wrapper">
          <motion.div className="address-modal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}>

            <div className="address-modal-header">
              <h3 className="address-modal-title">
                {editingPetId ? '編輯毛孩資料' : '新增毛孩資料'}
              </h3>
              <button className="address-modal-close" onClick={onClose}><X size={16} /></button>
            </div>

            {/* 毛孩 Emoji 預覽 */}
            <div className="pet-modal-preview">
              <div className="pet-modal-preview-info">
                <div className="pet-modal-preview-name">
                  {petForm.petName || '毛孩名稱'}
                </div>
                <div className="pet-modal-preview-sub">
                  {[
                    PET_TYPE_LABEL[petForm.petType],
                    petForm.petBreed,
                    PET_GENDER_LABEL[petForm.petGender],
                  ].filter(Boolean).join(' · ') || '尚未填寫資料'}
                </div>
              </div>
            </div>

            <div className="address-form">
              {/* 暱稱 */}
              <div>
                <label className="address-form-label">毛孩名稱 *</label>
                <input type="text" className="apple-input" placeholder="咪咪"
                  value={petForm.petName}
                  onChange={e => setPetForm(p => ({ ...p, petName: e.target.value }))} />
              </div>

              {/* 種類 + 性別 */}
              <div className="address-form-row">
                <div>
                  <label className="address-form-label">種類</label>
                  <select className="apple-input select-input"
                    value={petForm.petType}
                    onChange={e => setPetForm(p => ({ ...p, petType: e.target.value }))}>
                    <option value="">請選擇</option>
                    <option value="cat">貓咪</option>
                    <option value="dog">狗狗</option>
                  </select>
                </div>
                <div>
                  <label className="address-form-label">性別</label>
                  <select className="apple-input select-input"
                    value={petForm.petGender}
                    onChange={e => setPetForm(p => ({ ...p, petGender: e.target.value }))}>
                    <option value="">請選擇</option>
                    <option value="male">男生</option>
                    <option value="female">女生</option>
                  </select>
                </div>
              </div>

              {/* 品種 */}
              <div>
                <label className="address-form-label">品種</label>
                <input type="text" className="apple-input" placeholder="例如：柴犬、英國短毛貓"
                  value={petForm.petBreed}
                  onChange={e => setPetForm(p => ({ ...p, petBreed: e.target.value }))} />
              </div>

              {/* 年齡 + 體重 */}
              <div className="address-form-row">
                <div>
                  <label className="address-form-label">年齡（歲）</label>
                  <input type="number" className="apple-input" placeholder="3"
                    min="0" max="30"
                    value={petForm.petAge}
                    onChange={e => setPetForm(p => ({ ...p, petAge: e.target.value }))} />
                </div>
                <div>
                  <label className="address-form-label">體重（kg）</label>
                  <input type="text" className="apple-input" placeholder="例如：3.5"
                    value={petForm.petWeight}
                    onChange={e => setPetForm(p => ({ ...p, petWeight: e.target.value }))} />
                </div>
              </div>

              {/* 生日 */}
              <div>
                <label className="address-form-label">毛孩生日（選填）</label>
                <input type="date" className="apple-input"
                  value={petForm.petBirthday}
                  onChange={e => setPetForm(p => ({ ...p, petBirthday: e.target.value }))} />
              </div>
            </div>

            {petError && <div className="address-form-error">⚠️ {petError}</div>}

            <div className="address-modal-actions">
              <button className="btn-modal-cancel" onClick={onClose}>取消</button>
              <button className="btn-blue btn-modal-submit" onClick={onSave}>
                {editingPetId ? '儲存變更' : '新增毛孩'}
              </button>
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
)


// ─────────────────────────────────────────────
// 主元件
// ─────────────────────────────────────────────
const Account = () => {
  const { user, isLoading, logout, updateProfile, changePassword, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [activeTab,     setActiveTab]     = useState('profile')
  const [toast,         setToast]         = useState('')
  const [favorites,     setFavorites]     = useState(MOCK_FAVORITES)
  const [profileForm,   setProfileForm]   = useState({
    name: user?.name || '', phone: user?.phone || '',
    birthday: user?.birthday || '', gender: user?.gender || '',
  })
  const [passwordForm,  setPasswordForm]  = useState({ old: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')

  // 地址 state
  const [addresses,        setAddresses]        = useState(user?.addresses || [
    { id: 1, type: 'home', label: '住家', name: '王小明', phone: '0912-345-678', city: '台北市', district: '信義區', address: '信義路五段7號', isDefault: true },
  ])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm,      setAddressForm]      = useState(EMPTY_ADDRESS_FORM)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressError,     setAddressError]     = useState('')

  // 信用卡 state
  const [cards,         setCards]         = useState(MOCK_CARDS)
  const [showCardModal, setShowCardModal] = useState(false)
  const [cardForm,      setCardForm]      = useState(EMPTY_CARD_FORM)
  const [editingCardId, setEditingCardId] = useState(null)
  const [cardError,     setCardError]     = useState('')

  // ✅ 毛孩 state
  const [pets,         setPets]         = useState(user?.pets?.map((p, i) => ({ ...p, id: p.id || i + 1 })) || [])
  const [showPetModal, setShowPetModal] = useState(false)
  const [petForm,      setPetForm]      = useState(EMPTY_PET_FORM)
  const [editingPetId, setEditingPetId] = useState(null)
  const [petError,     setPetError]     = useState('')

  useEffect(() => {
    if      (location.pathname === '/orders')    setActiveTab('orders')
    else if (location.pathname === '/favorites') setActiveTab('favorites')
    else if (location.pathname === '/account') {
      setActiveTab(prev =>
        ['profile', 'addresses', 'cards', 'security'].includes(prev) ? prev : 'profile'
      )
    }
  }, [location.pathname])

  if (!isLoggedIn) return <Navigate to="/login" state={{ from: '/account' }} replace />

  const tier = getMemberTier(user?.points || 0)
  const nextTierPoints =
    (user?.points >= 8000) ? null :
    (user?.points >= 3000) ? 8000 :
    (user?.points >= 1000) ? 3000 : 1000
  const progressPct = nextTierPoints
    ? Math.min((user?.points / nextTierPoints) * 100, 100) : 100

  const showToast      = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const getInitials    = (name) => name ? name.slice(0, 2).toUpperCase() : 'PL'
  const handleNavClick = (tab) => {
    if      (tab.key === 'orders')    navigate('/orders')
    else if (tab.key === 'favorites') navigate('/favorites')
    else { navigate('/account'); setActiveTab(tab.key) }
  }
  const handleSaveProfile = () => { updateProfile(profileForm); showToast('個人資料已更新 ✓') }
  const handleLogout      = () => { logout(); navigate('/') }

  const handleChangePassword = async () => {
    if (!passwordForm.old || !passwordForm.new || !passwordForm.confirm) { setPasswordError('所有欄位都是必填的'); return }
    if (passwordForm.new !== passwordForm.confirm) { setPasswordError('新密碼與確認密碼不一致'); return }
    if (passwordForm.new.length < 8) { setPasswordError('新密碼至少 8 個字元'); return }
    const result = await changePassword(passwordForm.old, passwordForm.new)
    if (result.success) { setPasswordForm({ old: '', new: '', confirm: '' }); setPasswordError(''); showToast('密碼已更新 ✓') }
    else setPasswordError(result.message)
  }

  // ── 地址操作 ──
  const openAddAddressModal  = () => { setAddressForm(EMPTY_ADDRESS_FORM); setEditingAddressId(null); setAddressError(''); setShowAddressModal(true) }
  const openEditAddressModal = (addr) => { setAddressForm({ ...EMPTY_ADDRESS_FORM, ...addr }); setEditingAddressId(addr.id); setAddressError(''); setShowAddressModal(true) }
  const closeAddressModal    = () => { setShowAddressModal(false); setAddressError('') }

  const validateAddressForm = () => {
    if (addressForm.type === '711') {
      if (!addressForm.storeName.trim()) return '請選擇超商門市'
      if (!addressForm.name.trim())      return '請輸入收件人姓名'
      if (!addressForm.phone.trim())     return '請輸入手機號碼'
    } else {
      if (!addressForm.name.trim())      return '請輸入收件人姓名'
      if (!addressForm.phone.trim())     return '請輸入手機號碼'
      if (!addressForm.city)             return '請選擇縣市'
      if (!addressForm.district.trim())  return '請輸入行政區'
      if (!addressForm.address.trim())   return '請輸入詳細地址'
    }
    return ''
  }

  const handleSaveAddress = () => {
    const err = validateAddressForm()
    if (err) { setAddressError(err); return }
    if (editingAddressId) {
      setAddresses(prev => prev.map(a => {
        if (a.id !== editingAddressId) return addressForm.isDefault ? { ...a, isDefault: false } : a
        return { ...a, ...addressForm }
      }))
      showToast('地址已更新 ✓')
    } else {
      const newAddr = { ...addressForm, id: Date.now(), label: addressForm.label || (addressForm.type === '711' ? '超商取貨' : '宅配地址') }
      setAddresses(prev => {
        const base = addressForm.isDefault ? prev.map(a => ({ ...a, isDefault: false })) : prev
        return [...base, newAddr]
      })
      showToast('地址已新增 ✓')
    }
    closeAddressModal()
  }

  const handleDeleteAddress      = (id) => { setAddresses(prev => prev.filter(a => a.id !== id)); showToast('地址已刪除') }
  const handleSetDefaultAddress  = (id) => { setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id }))); showToast('已設為預設地址 ✓') }

  // ── 信用卡操作 ──
  const openAddCardModal  = () => { setCardForm(EMPTY_CARD_FORM); setEditingCardId(null); setCardError(''); setShowCardModal(true) }
  const openEditCardModal = (card) => {
    setCardForm({ ...EMPTY_CARD_FORM, holderName: card.holderName, expiryRaw: parseExpiryRaw(card.expiry), last4: card.last4, isDefault: card.isDefault })
    setEditingCardId(card.id); setCardError(''); setShowCardModal(true)
  }
  const closeCardModal = () => { setShowCardModal(false); setCardError('') }

  const validateCardForm = () => {
    if (!editingCardId) {
      if (cardForm.cardNumberRaw.length < 16)       return '請輸入完整的 16 碼卡號'
      if (!detectCardBrand(cardForm.cardNumberRaw))  return '不支援此卡片類型'
      if (!cardForm.cvv || cardForm.cvv.length < 3)  return '請輸入 3-4 碼安全碼'
    }
    if (!cardForm.holderName.trim()) return '請輸入持卡人姓名'
    const raw = cardForm.expiryRaw
    if (raw.length < 4) return '請輸入完整到期日'
    const mm = parseInt(raw.slice(0, 2), 10)
    const yy = parseInt(raw.slice(2, 4), 10)
    if (mm < 1 || mm > 12) return '月份格式錯誤'
    if (new Date(2000 + yy, mm - 1) < new Date()) return '此卡片已過期'
    return ''
  }

  const handleSaveCard = () => {
    const err = validateCardForm()
    if (err) { setCardError(err); return }
    if (editingCardId) {
      setCards(prev => prev.map(c => {
        if (c.id !== editingCardId) return cardForm.isDefault ? { ...c, isDefault: false } : c
        return { ...c, holderName: cardForm.holderName, expiry: displayExpiry(cardForm.expiryRaw), isDefault: cardForm.isDefault }
      }))
      showToast('信用卡已更新 ✓')
    } else {
      const newCard = { id: Date.now(), brand: detectCardBrand(cardForm.cardNumberRaw), last4: cardForm.cardNumberRaw.slice(-4), holderName: cardForm.holderName, expiry: displayExpiry(cardForm.expiryRaw), isDefault: cardForm.isDefault }
      setCards(prev => {
        const base = cardForm.isDefault ? prev.map(c => ({ ...c, isDefault: false })) : prev
        return [...base, newCard]
      })
      showToast('信用卡已新增 ✓')
    }
    closeCardModal()
  }

  const handleDeleteCard     = (card) => { if (!window.confirm(`確定要刪除 ${card.brand} •••• ${card.last4} 嗎？`)) return; setCards(prev => prev.filter(c => c.id !== card.id)); showToast('信用卡已刪除') }
  const handleSetDefaultCard = (id)   => { setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id }))); showToast('已設為預設付款方式 ✓') }

  // ── ✅ 毛孩操作 ──
  const openAddPetModal  = () => { setPetForm(EMPTY_PET_FORM); setEditingPetId(null); setPetError(''); setShowPetModal(true) }
  const openEditPetModal = (pet) => { setPetForm({ ...EMPTY_PET_FORM, ...pet }); setEditingPetId(pet.id); setPetError(''); setShowPetModal(true) }
  const closePetModal    = () => { setShowPetModal(false); setPetError('') }

  const validatePetForm = () => {
    if (!petForm.petName.trim()) return '請輸入毛孩暱稱'
    if (petForm.petWeight && isNaN(Number(petForm.petWeight))) return '體重請輸入數字（例如：3.5）'
    return ''
  }

  const handleSavePet = () => {
    const err = validatePetForm()
    if (err) { setPetError(err); return }
    if (editingPetId) {
      setPets(prev => prev.map(p => p.id === editingPetId ? { ...p, ...petForm } : p))
      showToast('毛孩資料已更新 ✓')
    } else {
      setPets(prev => [...prev, { ...petForm, id: Date.now() }])
      showToast('毛孩已新增 ✓')
    }
    closePetModal()
  }

  const handleDeletePet = (id) => {
    if (!window.confirm('確定要刪除此毛孩資料？')) return
    setPets(prev => prev.filter(p => p.id !== id))
    showToast('毛孩資料已刪除')
  }

  const fadeUp = {
    initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  }


  // ─────────────────────────────────────────────
  // Tab 內容
  // ─────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ── 個人資料（含毛孩管理） ──
      case 'profile': return (
        <motion.div key="profile" {...fadeUp}>
          <h2 className="account-section-title"><User size={22} className="account-nav-icon" />個人資料</h2>

          <div className="tier-progress-section">
            <div className="tier-progress-label">
              <span>目前點數：<strong style={{ color: 'var(--color-brand-coffee)' }}>{(user?.points || 0).toLocaleString()} 點</strong></span>
              {nextTierPoints && <span>距下一等級還差 {(nextTierPoints - user?.points).toLocaleString()} 點</span>}
            </div>
            <div className="tier-progress-bar">
              <div className="tier-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="profile-form">
            <div className="profile-form-row">
              <div className="profile-field">
                <label>姓名</label>
                <input type="text" className="apple-input" value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="profile-field">
                <label>手機號碼</label>
                <input type="tel" className="apple-input" value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-field">
                <label>電子郵件
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: 'var(--color-gray-dark)', background: 'var(--color-bg-light)', border: '1px solid var(--color-gray-light)', borderRadius: 980, padding: '1px 8px' }}>
                    如需變更，請洽服務人員
                  </span>
                </label>
                <input type="email" className="apple-input" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="profile-field">
                <label>生日
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: 'var(--color-gray-dark)', background: 'var(--color-bg-light)', border: '1px solid var(--color-gray-light)', borderRadius: 980, padding: '1px 8px' }}>
                    不可變更
                  </span>
                </label>
                <input type="date" className="apple-input" value={profileForm.birthday} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div className="profile-field" style={{ maxWidth: 300 }}>
              <label>性別</label>
              <select className="apple-input select-input" value={profileForm.gender}
                onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">請選擇</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">不願透露</option>
              </select>
            </div>
            <div>
              <button className="btn-blue profile-save-btn" onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? '儲存中...' : '儲存變更'}
              </button>
            </div>
          </div>

          {/* ── ✅ 毛孩管理區塊 ── */}
          <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--color-gray-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <PawPrint size={18} color="var(--color-brand-coffee)" />
                我的毛孩
                {pets.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 500, background: 'var(--color-bg-light)', border: '1px solid var(--color-gray-light)', borderRadius: 980, padding: '1px 10px', color: 'var(--color-gray-dark)' }}>
                    {pets.length} 隻
                  </span>
                )}
              </h3>
            </div>

            {pets.length === 0 ? (
              // 空狀態
              <div className="account-empty-state" style={{ padding: '32px 20px' }}>
                <div className="account-empty-icon" style={{ fontSize: 40 }}>🐾</div>
                <h3 style={{ fontSize: 15 }}>尚未新增毛孩資料</h3>
                <p style={{ fontSize: 13 }}>新增毛孩享有專屬生日優惠與健康推播</p>
                <button className="btn-blue" style={{ padding: '10px 24px', borderRadius: 980, fontSize: 14 }} onClick={openAddPetModal}>
                  新增毛孩
                </button>
              </div>
            ) : (
              <div className="address-grid">
                {pets.map(pet => (
                  <div key={pet.id} className="address-card">
                    {/* 頂部：Emoji + 名字 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 32, lineHeight: 1 }}>
                        {PET_EMOJI[pet.petType] || '🐾'}
                      </span>
                      <div>
                        <div className="address-name">{pet.petName}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-dark)', marginTop: 2 }}>
                          {PET_TYPE_LABEL[pet.petType] || '未設定種類'}
                          {pet.petBreed && ` · ${pet.petBreed}`}
                        </div>
                      </div>
                    </div>

                    {/* 詳細資訊 */}
                    <div className="address-detail" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 12 }}>
                      {pet.petGender && (
                        <span>{PET_GENDER_LABEL[pet.petGender]}</span>
                      )}
                      {pet.petAge && (
                        <span>{pet.petAge} 歲</span>
                      )}
                      {pet.petWeight && (
                        <span>{pet.petWeight} kg</span>
                      )}
                      {pet.petBirthday && (
                        <span>{pet.petBirthday}</span>
                      )}
                      {!pet.petGender && !pet.petAge && !pet.petWeight && !pet.petBirthday && (
                        <span style={{ color: 'var(--color-gray-dark)', fontStyle: 'italic' }}>尚未填寫詳細資料</span>
                      )}
                    </div>

                    {/* 操作按鈕 */}
                    <div className="address-actions">
                      <button className="btn-address-action" onClick={() => openEditPetModal(pet)}>
                        <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />編輯
                      </button>
                      <button className="btn-address-action" style={{ color: '#e74c3c' }}
                        onClick={() => handleDeletePet(pet.id)}>
                        <Trash2 size={12} style={{ display: 'inline' }} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 新增毛孩按鈕 */}
                <button className="btn-add-address" onClick={openAddPetModal}>
                  <Plus size={24} />新增毛孩
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )

      case 'orders': return (
        <motion.div key="orders" {...fadeUp}>
          <h2 className="account-section-title"><ShoppingBag size={22} className="account-nav-icon" />我的訂單</h2>
          <div className="order-list">
            {MOCK_ORDERS.map(order => (
              <div className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <div className="order-id">訂單 {order.id}</div>
                    <div className="order-date">{order.date}</div>
                  </div>
                  <span className={`order-status-badge ${order.status}`}>
                    <StatusIcon status={order.status} />{order.statusLabel}
                  </span>
                </div>
                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items.map((item, i) => <img key={i} src={item.img} alt={item.name} className="order-item-img" />)}
                  </div>
                  <div className="order-info">
                    <div className="order-total">NT${order.total.toLocaleString()}</div>
                    <div className="order-item-count">{order.items.length} 件商品</div>
                  </div>
                  <div className="order-actions">
                    <button className="btn-order-action">查看明細</button>
                    {order.status === 'delivered' && <button className="btn-order-action primary">再次購買</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )

      case 'favorites': return (
        <motion.div key="favorites" {...fadeUp}>
          <h2 className="account-section-title"><Heart size={22} className="account-nav-icon" />收藏清單</h2>
          {favorites.length === 0 ? (
            <div className="account-empty-state">
              <div className="account-empty-icon">🐾</div>
              <h3>收藏清單是空的</h3>
              <p>收藏您喜歡的商品，方便隨時購買</p>
              <Link to="/products" className="btn-blue" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 980, textDecoration: 'none', fontSize: 15 }}>探索商品</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              {favorites.map(item => (
                <div key={item.id}
                  style={{ borderRadius: 16, border: '1px solid var(--color-gray-light)', overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px var(--color-shadow-light)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
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

      case 'addresses': return (
        <motion.div key="addresses" {...fadeUp}>
          <h2 className="account-section-title"><MapPin size={22} className="account-nav-icon" />地址管理</h2>
          <div className="address-grid">
            {addresses.map(addr => (
              <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                {addr.isDefault && <span className="address-default-badge">預設</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {addr.type === '711'
                    ? <span className="address-type-badge type-711">超商取貨</span>
                    : <span className="address-type-badge type-home">{addr.label || '宅配到府'}</span>}
                </div>
                <div className="address-name">{addr.name}</div>
                <div className="address-detail">
                  {addr.phone}<br />
                  {addr.type === '711' ? addr.storeName : <>{addr.city}{addr.district}<br />{addr.address}</>}
                </div>
                <div className="address-actions">
                  <button className="btn-address-action" onClick={() => openEditAddressModal(addr)}>
                    <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />編輯
                  </button>
                  {!addr.isDefault && <button className="btn-address-action" onClick={() => handleSetDefaultAddress(addr.id)}>設為預設</button>}
                  {!addr.isDefault && (
                    <button className="btn-address-action" style={{ color: '#e74c3c' }}
                      onClick={() => window.confirm('確定要刪除此地址？') && handleDeleteAddress(addr.id)}>
                      <Trash2 size={12} style={{ display: 'inline' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button className="btn-add-address" onClick={openAddAddressModal}><Plus size={24} />新增地址</button>
          </div>
        </motion.div>
      )

      case 'cards': return (
        <motion.div key="cards" {...fadeUp}>
          <h2 className="account-section-title"><CreditCard size={22} className="account-nav-icon" />信用卡管理</h2>
          {cards.length === 0 ? (
            <div className="account-empty-state">
              <div className="account-empty-icon">💳</div>
              <h3>尚未綁定任何信用卡</h3>
              <p>新增信用卡以享有快速結帳體驗</p>
              <button className="btn-blue" style={{ padding: '12px 24px', borderRadius: 980, fontSize: 15 }} onClick={openAddCardModal}>新增信用卡</button>
            </div>
          ) : (
            <>
              <div className="address-grid">
                {cards.map(card => (
                  <div key={card.id} className={`address-card ${card.isDefault ? 'default' : ''}`}>
                    {card.isDefault && <span className="address-default-badge">預設付款</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <CardBrandBadge brand={card.brand} size="lg" />
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-dark)', letterSpacing: '0.12em' }}>•••• {card.last4}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray-dark)', marginBottom: 2 }}>持卡人</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: 10 }}>{card.holderName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray-dark)', marginBottom: 2 }}>到期日</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-dark)', marginBottom: 16 }}>{card.expiry}</div>
                    <div className="address-actions">
                      <button className="btn-address-action" onClick={() => openEditCardModal(card)}>
                        <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />編輯
                      </button>
                      {!card.isDefault && <button className="btn-address-action" onClick={() => handleSetDefaultCard(card.id)}>設為預設</button>}
                      <button className="btn-address-action" style={{ color: '#e74c3c' }} onClick={() => handleDeleteCard(card)}>
                        <Trash2 size={12} style={{ display: 'inline' }} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="btn-add-address" onClick={openAddCardModal}><Plus size={24} />新增信用卡</button>
              </div>
              <p style={{ marginTop: 24, fontSize: 12, color: 'var(--color-gray-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={12} />您的信用卡資訊經過 256-bit SSL 加密保護，Polar 不會儲存完整卡號
              </p>
            </>
          )}
        </motion.div>
      )

      case 'security': return (
        <motion.div key="security" {...fadeUp}>
          <h2 className="account-section-title"><ShieldCheck size={22} className="account-nav-icon" />帳號安全</h2>
          <div className="security-section">
            <div className="security-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="security-item-info" style={{ marginBottom: 20 }}>
                <h4>修改密碼</h4><p>定期更換密碼以保護帳號安全</p>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
                {['old', 'new', 'confirm'].map((field, i) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>
                      {['舊密碼', '新密碼（至少 8 碼）', '確認新密碼'][i]}
                    </label>
                    <input type="password" className="apple-input" value={passwordForm[field]}
                      onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))} />
                  </div>
                ))}
                {passwordError && <p style={{ fontSize: 13, color: '#e74c3c' }}>{passwordError}</p>}
                <button className="btn-blue" style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 980, fontSize: 15 }}
                  onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading ? '更新中...' : '更新密碼'}
                </button>
              </div>
            </div>
            <div className="security-item" style={{ borderColor: '#fee2e2' }}>
              <div className="security-item-info">
                <h4 style={{ color: '#e74c3c' }}>刪除帳號</h4>
                <p>此操作將無法復原，個人資料將被永久刪除</p>
              </div>
              <button style={{ padding: '8px 16px', borderRadius: 980, border: '1.5px solid #e74c3c', background: 'transparent', color: '#e74c3c', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                onClick={() => window.confirm('確定要刪除帳號嗎？此操作無法復原。') && handleLogout()}>
                刪除帳號
              </button>
            </div>
          </div>
        </motion.div>
      )

      default: return null
    }
  }


  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="account-page">

      <AddressModal
        show={showAddressModal} onClose={closeAddressModal}
        addressForm={addressForm} setAddressForm={setAddressForm}
        editingAddressId={editingAddressId}
        onSave={handleSaveAddress} addressError={addressError} onToast={showToast}
      />
      <CardModal
        show={showCardModal} onClose={closeCardModal}
        cardForm={cardForm} setCardForm={setCardForm}
        editingCardId={editingCardId}
        onSave={handleSaveCard} cardError={cardError}
      />
      {/* ✅ PetModal */}
      <PetModal
        show={showPetModal} onClose={closePetModal}
        petForm={petForm} setPetForm={setPetForm}
        editingPetId={editingPetId}
        onSave={handleSavePet} petError={petError}
      />

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
            <div className="account-tier-badge" style={{ color: tier.color, backgroundColor: tier.bg }}>⭐ {tier.label}</div>
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
                {activeTab === key && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-brand-blue)' }} />}
              </button>
            ))}
            <button className="account-nav-item logout-btn" onClick={handleLogout}>
              <LogOut size={16} className="account-nav-icon" />登出帳號
            </button>
          </div>
        </div>

        <div className="account-content">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast} />}
      </AnimatePresence>
    </div>
  )
}

export default Account
