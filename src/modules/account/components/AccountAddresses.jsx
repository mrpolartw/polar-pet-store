import { useEffect, useState } from 'react'
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
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '台南市',
  '高雄市',
  '基隆市',
  '新竹市',
  '嘉義市',
  '新竹縣',
  '苗栗縣',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義縣',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '台東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

function normalizeAddressForm(address = {}) {
  return {
    ...EMPTY_ADDRESS_FORM,
    ...address,
    label: address.label || '',
    name: address.name || '',
    phone: address.phone || '',
    city: address.city || '',
    district: address.district || '',
    address: address.address || '',
    isDefault: Boolean(address.isDefault),
    storeName: address.storeName || '',
    storeId: address.storeId || '',
  }
}

function getAddressLabel(address) {
  if (address.type === '711') {
    return address.label || '超商取貨'
  }

  return address.label || '住家'
}

function validateAddressForm(form) {
  if (!form.name.trim()) return '請輸入收件人姓名'
  if (!form.phone.trim()) return '請輸入聯絡電話'

  if (form.type === '711') {
    if (!form.storeName.trim()) return '請選擇 7-ELEVEN 門市'
    return ''
  }

  if (!form.city) return '請選擇縣市'
  if (!form.district.trim()) return '請輸入區域'
  if (!form.address.trim()) return '請輸入詳細地址'
  return ''
}

function AddressModal({
  show,
  form,
  editingAddress,
  errorMessage,
  onClose,
  onChange,
  onSave,
  onMockSelectStore,
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
                <h3 className="address-modal-title">
                  {editingAddress ? '編輯地址' : '新增地址'}
                </h3>
                <button type="button" className="address-modal-close" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>

              <div className="address-type-grid">
                {[
                  { key: 'home', label: '宅配地址', desc: '一般住家與公司收件' },
                  { key: '711', label: '7-ELEVEN 取貨', desc: '付款後再導向正式門市選擇流程' },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`address-type-btn ${form.type === option.key ? 'active' : ''}`}
                    onClick={() => onChange({ type: option.key })}
                  >
                    <div className="address-type-btn-label">{option.label}</div>
                    <div className="address-type-btn-desc">{option.desc}</div>
                  </button>
                ))}
              </div>

              {form.type === 'home' ? (
                <div className="address-form">
                  <div>
                    <label className="address-form-label">地址標籤</label>
                    <div className="address-label-tags">
                      {['住家', '公司', '其他'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`address-label-tag ${form.label === tag ? 'active' : ''}`}
                          onClick={() => onChange({ label: tag })}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="address-form-row">
                    <div>
                      <label className="address-form-label">收件人姓名</label>
                      <input
                        type="text"
                        className="apple-input"
                        placeholder="請輸入收件人姓名"
                        value={form.name}
                        onChange={(event) => onChange({ name: event.target.value })}
                      />
                    </div>
                    <div>
                      <label className="address-form-label">聯絡電話</label>
                      <input
                        type="tel"
                        className="apple-input"
                        placeholder="0912-345-678"
                        value={form.phone}
                        onChange={(event) => onChange({ phone: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="address-form-row">
                    <div>
                      <label className="address-form-label">縣市</label>
                      <select
                        className="apple-input select-input"
                        value={form.city}
                        onChange={(event) => onChange({ city: event.target.value })}
                      >
                        <option value="">請選擇縣市</option>
                        {TW_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="address-form-label">區域</label>
                      <input
                        type="text"
                        className="apple-input"
                        placeholder="例如：中山區"
                        value={form.district}
                        onChange={(event) => onChange({ district: event.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="address-form-label">詳細地址</label>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="請輸入街道、巷弄、樓層門牌"
                      value={form.address}
                      onChange={(event) => onChange({ address: event.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="address-form">
                  <div className="store-picker-box">
                    <Store size={28} color="var(--color-brand-coffee)" style={{ marginBottom: 8 }} />
                    {form.storeName ? (
                      <>
                        <p className="store-picker-name">{form.storeName}</p>
                        {form.storeId && (
                          <p className="store-picker-id">門市代碼：{form.storeId}</p>
                        )}
                        <button
                          type="button"
                          className="store-picker-reselect"
                          onClick={onMockSelectStore}
                        >
                          重新選擇門市
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="store-picker-desc">先用測試門市完成串接，正式環境再接 PayUni 門市地圖。</p>
                        <button
                          type="button"
                          className="btn-blue"
                          style={{ padding: '10px 24px', borderRadius: 980, fontSize: 14 }}
                          onClick={onMockSelectStore}
                        >
                          選擇 7-ELEVEN 門市
                        </button>
                      </>
                    )}
                  </div>

                  <div className="address-form-row">
                    <div>
                      <label className="address-form-label">收件人姓名</label>
                      <input
                        type="text"
                        className="apple-input"
                        placeholder="請輸入收件人姓名"
                        value={form.name}
                        onChange={(event) => onChange({ name: event.target.value })}
                      />
                    </div>
                    <div>
                      <label className="address-form-label">聯絡電話</label>
                      <input
                        type="tel"
                        className="apple-input"
                        placeholder="0912-345-678"
                        value={form.phone}
                        onChange={(event) => onChange({ phone: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="store-notice">
                    <strong>注意：</strong> 結帳時仍會以實際物流流程為主，目前這裡先保留測試門市資料方便串接驗證。
                  </div>
                </div>
              )}

              <label className="address-default-check">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => onChange({ isDefault: event.target.checked })}
                />
                設為預設地址
              </label>

              {errorMessage && <div className="address-form-error">{errorMessage}</div>}

              <div className="address-modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={onClose}>
                  取消
                </button>
                <button type="button" className="btn-blue btn-modal-submit" onClick={onSave}>
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
  const { user, createAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth()
  const toast = useToast()

  const [addresses, setAddresses] = useState(user?.addresses || [])
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    setAddresses(user?.addresses || [])
  }, [user?.addresses])

  const openAddAddressModal = () => {
    setAddressForm(EMPTY_ADDRESS_FORM)
    setEditingAddress(null)
    setAddressError('')
    setIsAddressModalOpen(true)
  }

  const openEditAddressModal = (address) => {
    setAddressForm(normalizeAddressForm(address))
    setEditingAddress(address)
    setAddressError('')
    setIsAddressModalOpen(true)
  }

  const closeAddressModal = () => {
    setIsAddressModalOpen(false)
    setAddressError('')
  }

  const updateForm = (partial) => {
    setAddressForm((prev) => ({ ...prev, ...partial }))
    setAddressError('')
  }

  const handleMockSelectStore = () => {
    setAddressForm((prev) => ({
      ...prev,
      storeName: '7-ELEVEN 台北測試門市',
      storeId: 'TEST001',
      label: prev.label || '超商取貨',
    }))
    toast.info('已套用測試門市，之後可再接 PayUni 正式選店流程')
  }

  const handleSaveAddress = async () => {
    try {
      const errorMessage = validateAddressForm(addressForm)

      if (errorMessage) {
        setAddressError(errorMessage)
        return
      }

      const payload = {
        ...addressForm,
        label: addressForm.label || (addressForm.type === '711' ? '超商取貨' : '住家'),
      }

      const result = editingAddress
        ? await updateAddress(editingAddress.id, payload)
        : await createAddress(payload)

      if (result?.success === false) {
        throw new Error(result.message || '地址儲存失敗')
      }

      toast.success(editingAddress ? '地址已更新' : '地址已新增')
      closeAddressModal()
    } catch (error) {
      toast.error(error?.message || '地址儲存失敗，請稍後再試')
    }
  }

  const handleDeleteAddress = async (addressId) => {
    try {
      const result = await deleteAddress(addressId)

      if (result?.success === false) {
        throw new Error(result.message || '地址刪除失敗')
      }

      toast.success('地址已刪除')
    } catch (error) {
      toast.error(error?.message || '地址刪除失敗，請稍後再試')
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const result = await setDefaultAddress(addressId)

      if (result?.success === false) {
        throw new Error(result.message || '設定預設地址失敗')
      }

      toast.success('已設為預設地址')
    } catch (error) {
      toast.error(error?.message || '設定預設地址失敗，請稍後再試')
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
        form={addressForm}
        editingAddress={editingAddress}
        errorMessage={addressError}
        onClose={closeAddressModal}
        onChange={updateForm}
        onSave={handleSaveAddress}
        onMockSelectStore={handleMockSelectStore}
      />

      <div className="address-grid">
        {addresses.map((address) => (
          <div key={address.id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
            {address.isDefault && <span className="address-default-badge">預設</span>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {address.type === '711' ? (
                <span className="address-type-badge type-711">超商取貨</span>
              ) : (
                <span className="address-type-badge type-home">{getAddressLabel(address)}</span>
              )}
            </div>

            <div className="address-name">{address.name}</div>

            <div className="address-detail">
              {address.phone}
              <br />
              {address.type === '711' ? (
                <>
                  {address.storeName || '尚未選擇門市'}
                  {address.storeId ? ` (${address.storeId})` : ''}
                </>
              ) : (
                <>
                  {[address.city, address.district].filter(Boolean).join('')}
                  <br />
                  {address.address}
                </>
              )}
            </div>

            <div className="address-actions">
              <button type="button" className="btn-address-action" onClick={() => openEditAddressModal(address)}>
                <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                編輯
              </button>

              {!address.isDefault && (
                <button
                  type="button"
                  className="btn-address-action"
                  onClick={() => handleSetDefaultAddress(address.id)}
                >
                  設為預設
                </button>
              )}

              {!address.isDefault && (
                <button
                  type="button"
                  className="btn-address-action"
                  style={{ color: '#e74c3c' }}
                  onClick={() => {
                    if (window.confirm('確定要刪除這筆地址嗎？')) {
                      handleDeleteAddress(address.id)
                    }
                  }}
                >
                  <Trash2 size={12} style={{ display: 'inline' }} />
                </button>
              )}
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="address-card" style={{ display: 'grid', placeItems: 'center', minHeight: 180 }}>
            <div style={{ textAlign: 'center', color: 'var(--color-gray-dark)', lineHeight: 1.7 }}>
              目前還沒有儲存地址
              <br />
              新增後結帳可以直接帶入
            </div>
          </div>
        )}

        <button type="button" className="btn-add-address" onClick={openAddAddressModal}>
          <Plus size={24} />
          新增地址
        </button>
      </div>
    </motion.div>
  )
}
