import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, MapPin, Plus, Store, Trash2, X } from 'lucide-react'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'

const EMPTY_ADDRESS_FORM = {
  type: 'home',
  label: '',
  name: '',
  phone: '',
  city: '',
  district: '',
  address: '',
  isDefault: false,
  storeName: '',
  storeId: '',
}

const TW_CITIES = [
  '台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣',
  '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市',
  '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

function AddressModal({
  show,
  onClose,
  addressForm,
  setAddressForm,
  editingAddress,
  onSave,
  addressError,
  onToast,
}) {
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
                <h3 className="address-modal-title">{editingAddress ? '編輯地址' : '新增地址'}</h3>
                <button className="address-modal-close" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>

              <div className="address-type-grid">
                {[
                  { key: 'home', label: '宅配地址', desc: '提供一般配送使用' },
                  { key: '711', label: '7-11 超商取貨', desc: '模擬 PayUni 門市選擇' },
                ].map((option) => (
                  <button
                    key={option.key}
                    className={`address-type-btn ${addressForm.type === option.key ? 'active' : ''}`}
                    onClick={() => setAddressForm((prev) => ({ ...prev, type: option.key }))}
                  >
                    <div className="address-type-btn-label">{option.label}</div>
                    <div className="address-type-btn-desc">{option.desc}</div>
                  </button>
                ))}
              </div>

              {addressForm.type === 'home' && (
                <div className="address-form">
                  <div>
                    <label className="address-form-label">地址標籤</label>
                    <div className="address-label-tags">
                      {['住家', '公司', '其他'].map((tag) => (
                        <button
                          key={tag}
                          className={`address-label-tag ${addressForm.label === tag ? 'active' : ''}`}
                          onClick={() => setAddressForm((prev) => ({ ...prev, label: tag }))}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="自訂標籤（例如：爸媽家）"
                      value={['住家', '公司', '其他'].includes(addressForm.label) ? '' : addressForm.label}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                    />
                  </div>

                  <div className="address-form-row">
                    <div>
                      <label className="address-form-label">收件人姓名 *</label>
                      <input
                        type="text"
                        className="apple-input"
                        placeholder="請輸入姓名"
                        value={addressForm.name}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="address-form-label">手機號碼 *</label>
                      <input
                        type="tel"
                        className="apple-input"
                        placeholder="0912-345-678"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="address-form-row">
                    <div>
                      <label className="address-form-label">縣市 *</label>
                      <select
                        className="apple-input select-input"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                      >
                        <option value="">請選擇縣市</option>
                        {TW_CITIES.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="address-form-label">行政區 *</label>
                      <input
                        type="text"
                        className="apple-input"
                        placeholder="例如：大安區"
                        value={addressForm.district}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="address-form-label">詳細地址 *</label>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="街道、巷弄、樓層"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
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
                        <button
                          className="store-picker-reselect"
                          onClick={() => onToast('目前為 PayUni 模擬選店流程')}
                        >
                          重新選擇門市
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="store-picker-desc">點擊下方按鈕，模擬開啟 7-11 電子地圖選店。</p>
                        <button
                          className="btn-blue"
                          style={{ padding: '10px 24px', borderRadius: 980, fontSize: 14 }}
                          onClick={() => {
                            setAddressForm((prev) => ({
                              ...prev,
                              storeName: '7-ELEVEN 大安門市',
                              storeId: 'TEST001',
                            }))
                            onToast('已完成模擬選店，門市資料已帶入')
                          }}
                        >
                          選擇 7-11 門市
                        </button>
                      </>
                    )}
                  </div>

                  <div className="address-form-row">
                    <div>
                      <label className="address-form-label">收件人姓名 *</label>
                      <input
                        type="text"
                        className="apple-input"
                        placeholder="請輸入姓名"
                        value={addressForm.name}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="address-form-label">手機號碼 *</label>
                      <input
                        type="tel"
                        className="apple-input"
                        placeholder="0912-345-678"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="store-notice">
                    <strong>提醒：</strong> 此流程目前為前端展示用途，尚未串接真實超商選店服務。
                  </div>
                </div>
              )}

              <label className="address-default-check">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                />
                設為預設收件地址
              </label>

              {addressError && <div className="address-form-error">提示：{addressError}</div>}

              <div className="address-modal-actions">
                <button className="btn-modal-cancel" onClick={onClose}>取消</button>
                <button className="btn-blue btn-modal-submit" onClick={onSave}>
                  {editingAddress ? '儲存變更' : '新增地址'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function AccountAddresses() {
  const { user } = useAuth()
  const toast = useToast()

  const [addresses, setAddresses] = useState(
    user?.addresses || [
      {
        id: 1,
        type: 'home',
        label: '住家',
        name: '王小明',
        phone: '0912-345-678',
        city: '台北市',
        district: '大安區',
        address: '仁愛路四段 100 號 5 樓',
        isDefault: true,
      },
    ],
  )
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressError, setAddressError] = useState('')

  const openAddAddressModal = () => {
    setAddressForm(EMPTY_ADDRESS_FORM)
    setEditingAddress(null)
    setAddressError('')
    setIsAddressModalOpen(true)
  }

  const openEditAddressModal = (address) => {
    setAddressForm({ ...EMPTY_ADDRESS_FORM, ...address })
    setEditingAddress(address)
    setAddressError('')
    setIsAddressModalOpen(true)
  }

  const closeAddressModal = () => {
    setIsAddressModalOpen(false)
    setAddressError('')
  }

  const validateAddressForm = () => {
    if (addressForm.type === '711') {
      if (!addressForm.storeName.trim()) return '請先選擇門市'
      if (!addressForm.name.trim()) return '請輸入收件人姓名'
      if (!addressForm.phone.trim()) return '請輸入手機號碼'
    } else {
      if (!addressForm.name.trim()) return '請輸入收件人姓名'
      if (!addressForm.phone.trim()) return '請輸入手機號碼'
      if (!addressForm.city) return '請選擇縣市'
      if (!addressForm.district.trim()) return '請輸入行政區'
      if (!addressForm.address.trim()) return '請輸入詳細地址'
    }
    return ''
  }

  const handleSaveAddress = () => {
    try {
      const error = validateAddressForm()
      if (error) {
        setAddressError(error)
        return
      }

      if (editingAddress) {
        setAddresses((prev) => prev.map((address) => {
          if (address.id !== editingAddress.id) {
            return addressForm.isDefault ? { ...address, isDefault: false } : address
          }

          return { ...address, ...addressForm }
        }))
        toast.success('地址已更新')
      } else {
        const nextAddress = {
          ...addressForm,
          id: Date.now(),
          label: addressForm.label || (addressForm.type === '711' ? '超商取貨' : '宅配地址'),
        }

        setAddresses((prev) => {
          const base = addressForm.isDefault ? prev.map((address) => ({ ...address, isDefault: false })) : prev
          return [...base, nextAddress]
        })
        toast.success('地址已新增')
      }

      closeAddressModal()
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  const handleDeleteAddress = (id) => {
    try {
      setAddresses((prev) => prev.filter((address) => address.id !== id))
      toast.success('地址已刪除')
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  const handleSetDefaultAddress = (id) => {
    try {
      setAddresses((prev) => prev.map((address) => ({ ...address, isDefault: address.id === id })))
      toast.success('已設為預設地址')
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  return (
    <motion.div key="addresses" {...fadeUp}>
      <h2 className="account-section-title">
        <MapPin size={22} className="account-nav-icon" />
        地址管理
      </h2>

      <AddressModal
        show={isAddressModalOpen}
        onClose={closeAddressModal}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        editingAddress={editingAddress}
        onSave={handleSaveAddress}
        addressError={addressError}
        onToast={(message) => toast.info(message)}
      />

      <div className="address-grid">
        {addresses.map((address) => (
          <div key={address.id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
            {address.isDefault && <span className="address-default-badge">預設</span>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {address.type === '711'
                ? <span className="address-type-badge type-711">超商取貨</span>
                : <span className="address-type-badge type-home">{address.label || '宅配地址'}</span>}
            </div>

            <div className="address-name">{address.name}</div>

            <div className="address-detail">
              {address.phone}
              <br />
              {address.type === '711'
                ? address.storeName
                : (
                  <>
                    {address.city}{address.district}
                    <br />
                    {address.address}
                  </>
                )}
            </div>

            <div className="address-actions">
              <button className="btn-address-action" onClick={() => openEditAddressModal(address)}>
                <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                編輯
              </button>
              {!address.isDefault && (
                <button className="btn-address-action" onClick={() => handleSetDefaultAddress(address.id)}>
                  設為預設
                </button>
              )}
              {!address.isDefault && (
                <button
                  className="btn-address-action"
                  style={{ color: '#e74c3c' }}
                  onClick={() => window.confirm('確定要刪除此地址嗎？') && handleDeleteAddress(address.id)}
                >
                  <Trash2 size={12} style={{ display: 'inline' }} />
                </button>
              )}
            </div>
          </div>
        ))}

        <button className="btn-add-address" onClick={openAddAddressModal}>
          <Plus size={24} />
          新增地址
        </button>
      </div>
    </motion.div>
  )
}
