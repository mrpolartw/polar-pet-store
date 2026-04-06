import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, MapPin, Plus, Store, Trash2, X } from 'lucide-react'
import { useToast } from '../../../context/ToastContext'
import { useAddresses } from '../../../hooks/useMember'

const EMPTY_ADDRESS_FORM = {
  type: 'home',
  label: '',
  name: '',
  phone: '',
  city: '',
  district: '',
  address: '',
  postalCode: '',
  isDefault: false,
  storeName: '',
  storeId: '',
  storeType: '',
}

const TW_CITIES = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const mapAddressToForm = (address) => ({
  ...EMPTY_ADDRESS_FORM,
  type: address?.type ?? ((address?.store_type || address?.store_name || address?.store_id) ? '711' : 'home'),
  label: address?.label || '',
  name: address?.name ?? address?.recipient_name ?? '',
  phone: address?.phone || '',
  city: address?.city || '',
  district: address?.district || '',
  address: address?.address || '',
  postalCode: address?.postalCode ?? address?.postal_code ?? '',
  isDefault: Boolean(address?.isDefault ?? address?.is_default),
  storeName: address?.storeName ?? address?.store_name ?? '',
  storeId: address?.storeId ?? address?.store_id ?? '',
  storeType: address?.storeType ?? address?.store_type ?? '',
})

const buildAddressPayload = (addressForm) => {
  const isStore = addressForm.type === '711'

  return {
    label: addressForm.label || (isStore ? '超商取貨' : '住家'),
    recipient_name: addressForm.name.trim(),
    phone: addressForm.phone.trim(),
    postal_code: addressForm.postalCode || '',
    city: isStore ? '' : addressForm.city,
    district: isStore ? '' : addressForm.district,
    address: isStore ? '' : addressForm.address,
    is_default: Boolean(addressForm.isDefault),
    store_type: isStore ? (addressForm.storeType || '7-11') : '',
    store_id: isStore ? addressForm.storeId : '',
    store_name: isStore ? addressForm.storeName : '',
  }
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
                  { key: 'home', label: '宅配地址', desc: '適用一般宅配與常用收件地址' },
                  { key: '711', label: '7-11 取貨', desc: '使用超商門市資訊快速建立地址' },
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
                      placeholder="自訂地址標籤"
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
                        placeholder="請輸入收件人姓名"
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
                      placeholder="請輸入住址與門牌號碼"
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
                        {addressForm.storeId && <p className="store-picker-id">門市代碼：{addressForm.storeId}</p>}
                        <button
                          className="store-picker-reselect"
                          onClick={() => onToast('請串接超商門市選擇器後替換這段示範流程')}
                        >
                          重新選擇門市
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="store-picker-desc">目前先以示意資料模擬 7-11 門市選擇流程。</p>
                        <button
                          className="btn-blue"
                          style={{ padding: '10px 24px', borderRadius: 980, fontSize: 14 }}
                          onClick={() => {
                            setAddressForm((prev) => ({
                              ...prev,
                              storeName: '7-ELEVEN 測試門市',
                              storeId: 'TEST001',
                              storeType: '7-11',
                              label: prev.label || '超商取貨',
                            }))
                            onToast('已帶入示範門市資料')
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
                        placeholder="請輸入收件人姓名"
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
                    <strong>提示：</strong> 目前門市選擇仍是前端示意流程，未來可直接接入超商選店服務。
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

              {addressError && <div className="address-form-error">{addressError}</div>}

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
  const toast = useToast()
  const {
    addresses,
    loading,
    error,
    add: addAddressApi,
    update: updateAddressApi,
    remove: removeAddressApi,
  } = useAddresses()
  const addressList = Array.isArray(addresses) ? addresses : []

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
    setAddressForm(mapAddressToForm(address))
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
      if (!addressForm.storeName.trim()) return '請先選擇超商門市'
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

  const handleSaveAddress = async () => {
    try {
      const nextError = validateAddressForm()
      if (nextError) {
        setAddressError(nextError)
        return
      }

      const payload = buildAddressPayload(addressForm)

      if (editingAddress) {
        await updateAddressApi(editingAddress.id, payload)
        toast.success('地址已更新')
      } else {
        await addAddressApi(payload)
        toast.success('地址已新增')
      }

      closeAddressModal()
    } catch (err) {
      toast.error(err?.message || '地址儲存失敗，請稍後再試')
    }
  }

  const handleDeleteAddress = async (id) => {
    try {
      if (!window.confirm('確定要刪除這筆收件地址嗎？')) return
      if (!window.confirm('刪除後將無法復原，是否繼續？')) return
      await removeAddressApi(id)
      toast.success('地址已刪除')
    } catch (err) {
      toast.error(err?.message || '地址刪除失敗，請稍後再試')
    }
  }

  const handleSetDefaultAddress = async (id) => {
    try {
      await updateAddressApi(id, { is_default: true })
      toast.success('已設為預設地址')
    } catch (err) {
      toast.error(err?.message || '設定預設地址失敗，請稍後再試')
    }
  }

  return (
    <motion.div key="addresses" {...fadeUp}>
      <h2 className="account-section-title">
        <MapPin size={22} className="account-nav-icon" />
        收件地址
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
        {loading && addressList.length === 0 && (
          <div className="address-card">
            <div className="address-name">資料載入中...</div>
            <div className="address-detail">正在取得你的收件地址。</div>
          </div>
        )}

        {error && addressList.length === 0 && (
          <div className="address-card">
            <div className="address-name">載入失敗</div>
            <div className="address-detail">{error}</div>
          </div>
        )}

        {addressList.map((address) => {
          const addressView = mapAddressToForm(address)

          return (
            <div key={address.id} className={`address-card ${addressView.isDefault ? 'default' : ''}`}>
              {addressView.isDefault && <span className="address-default-badge">預設</span>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                {addressView.type === '711'
                  ? <span className="address-type-badge type-711">超商取貨</span>
                  : <span className="address-type-badge type-home">{addressView.label || '宅配地址'}</span>}
              </div>

              <div className="address-name">{addressView.name}</div>

              <div className="address-detail">
                {addressView.phone}
                <br />
                {addressView.type === '711'
                  ? addressView.storeName
                  : (
                    <>
                      {addressView.city}{addressView.district}
                      <br />
                      {addressView.address}
                    </>
                  )}
              </div>

              <div className="address-actions">
                <button className="btn-address-action" onClick={() => openEditAddressModal(address)}>
                  <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                  編輯
                </button>
                {!addressView.isDefault && (
                  <button className="btn-address-action" onClick={() => handleSetDefaultAddress(address.id)}>
                    設為預設
                  </button>
                )}
                {!addressView.isDefault && (
                  <button
                    className="btn-address-action"
                    style={{ color: '#e74c3c' }}
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    <Trash2 size={12} style={{ display: 'inline' }} />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        <button className="btn-add-address" onClick={openAddAddressModal}>
          <Plus size={24} />
          新增地址
        </button>
      </div>
    </motion.div>
  )
}
