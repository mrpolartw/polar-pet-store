import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, MapPin, Plus, Store, Trash2, X } from 'lucide-react'

import { LoadingSpinner, EmptyState } from '../../../components/common'
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

function AddressModal({
  show,
  onClose,
  addressForm,
  setAddressForm,
  editingAddress,
  onSave,
  addressError,
  isSaving,
}) {
  return (
    <AnimatePresence>
      {show ? (
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
                  { key: 'home', label: '宅配地址', desc: '提供完整收件地址與收件資訊' },
                  { key: '711', label: '7-11 取貨', desc: '可先儲存常用門市與收件人資料' },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`address-type-btn ${addressForm.type === option.key ? 'active' : ''}`}
                    onClick={() =>
                      setAddressForm((prev) => ({
                        ...prev,
                        type: option.key,
                      }))
                    }
                  >
                    <div className="address-type-btn-label">{option.label}</div>
                    <div className="address-type-btn-desc">{option.desc}</div>
                  </button>
                ))}
              </div>

              <div className="address-form">
                <div>
                  <label className="address-form-label" htmlFor="account-address-label">
                    地址標籤
                  </label>
                  <input
                    id="account-address-label"
                    name="label"
                    type="text"
                    className="apple-input"
                    placeholder="例如：住家、公司、媽媽家"
                    autoComplete="organization-title"
                    value={addressForm.label}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, label: event.target.value }))
                    }
                  />
                </div>

                <div className="address-form-row">
                  <div>
                    <label className="address-form-label" htmlFor="account-address-name">
                      收件人姓名
                    </label>
                    <input
                      id="account-address-name"
                      name="name"
                      type="text"
                      className="apple-input"
                      placeholder="請輸入收件人姓名"
                      autoComplete="name"
                      value={addressForm.name}
                      onChange={(event) =>
                        setAddressForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="address-form-label" htmlFor="account-address-phone">
                      手機號碼
                    </label>
                    <input
                      id="account-address-phone"
                      name="phone"
                      type="tel"
                      className="apple-input"
                      placeholder="0912-345-678"
                      autoComplete="tel"
                      value={addressForm.phone}
                      onChange={(event) =>
                        setAddressForm((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />
                  </div>
                </div>

                {addressForm.type === 'home' ? (
                  <>
                    <div className="address-form-row">
                      <div>
                        <label className="address-form-label" htmlFor="account-address-city">
                          縣市
                        </label>
                        <select
                          id="account-address-city"
                          name="city"
                          className="apple-input select-input"
                          autoComplete="address-level1"
                          value={addressForm.city}
                          onChange={(event) =>
                            setAddressForm((prev) => ({ ...prev, city: event.target.value }))
                          }
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
                        <label className="address-form-label" htmlFor="account-address-district">
                          區域
                        </label>
                        <input
                          id="account-address-district"
                          name="district"
                          type="text"
                          className="apple-input"
                          placeholder="例如：中山區"
                          autoComplete="address-level2"
                          value={addressForm.district}
                          onChange={(event) =>
                            setAddressForm((prev) => ({
                              ...prev,
                              district: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="address-form-label" htmlFor="account-address-line1">
                        詳細地址
                      </label>
                      <input
                        id="account-address-line1"
                        name="address"
                        type="text"
                        className="apple-input"
                        placeholder="請輸入街道、巷弄、門牌與樓層"
                        autoComplete="street-address"
                        value={addressForm.address}
                        onChange={(event) =>
                          setAddressForm((prev) => ({ ...prev, address: event.target.value }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className="address-form-row">
                    <div>
                      <label className="address-form-label" htmlFor="account-address-store-name">
                        7-11 門市名稱
                      </label>
                      <input
                        id="account-address-store-name"
                        name="storeName"
                        type="text"
                        className="apple-input"
                        placeholder="例如：南京門市"
                        value={addressForm.storeName}
                        onChange={(event) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            storeName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="address-form-label" htmlFor="account-address-store-id">
                        門市代碼
                      </label>
                      <input
                        id="account-address-store-id"
                        name="storeId"
                        type="text"
                        className="apple-input"
                        placeholder="例如：TEST001"
                        value={addressForm.storeId}
                        onChange={(event) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            storeId: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                <label className="address-default-check" htmlFor="account-address-default">
                  <input
                    id="account-address-default"
                    name="isDefault"
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(event) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        isDefault: event.target.checked,
                      }))
                    }
                  />
                  設為預設地址
                </label>

                {addressError ? <div className="address-form-error">{addressError}</div> : null}
              </div>

              <div className="address-modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={onClose}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn-blue btn-modal-submit"
                  onClick={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? '儲存中...' : editingAddress ? '儲存變更' : '新增地址'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function getAddressSummary(address) {
  if (address.type === '711') {
    return address.storeName || '尚未設定門市'
  }

  return [address.city, address.district, address.address].filter(Boolean).join('')
}

export default function AccountAddresses() {
  const toast = useToast()
  const [addresses, setAddresses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressError, setAddressError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState('')

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((current, next) => {
      if (current.isDefault !== next.isDefault) {
        return current.isDefault ? -1 : 1
      }

      return String(next.updatedAt ?? '').localeCompare(String(current.updatedAt ?? ''))
    })
  }, [addresses])

  const fetchAddresses = useCallback(async () => {
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const openAddAddressModal = () => {
    setAddressForm(EMPTY_ADDRESS_FORM)
    setEditingAddress(null)
    setAddressError('')
    setIsAddressModalOpen(true)
  }

  const openEditAddressModal = (address) => {
    setAddressForm({
      type: address.type || 'home',
      label: address.label || '',
      name: address.name || '',
      phone: address.phone || '',
      city: address.city || '',
      district: address.district || '',
      address: address.address || '',
      isDefault: Boolean(address.isDefault),
      storeName: address.storeName || '',
      storeId: address.storeId || '',
    })
    setEditingAddress(address)
    setAddressError('')
    setIsAddressModalOpen(true)
  }

  const closeAddressModal = () => {
    setIsAddressModalOpen(false)
    setAddressError('')
    setEditingAddress(null)
  }

  const validateAddressForm = () => {
    if (!addressForm.name.trim()) return '請輸入收件人姓名'
    if (!addressForm.phone.trim()) return '請輸入手機號碼'

    if (addressForm.type === 'home') {
      if (!addressForm.city) return '請選擇縣市'
      if (!addressForm.district.trim()) return '請輸入區域'
      if (!addressForm.address.trim()) return '請輸入詳細地址'
    }

    if (addressForm.type === '711' && !addressForm.storeName.trim()) {
      return '請輸入 7-11 門市名稱'
    }

    return ''
  }

  const buildPayload = () => ({
    type: addressForm.type,
    label: addressForm.label.trim() || null,
    name: addressForm.name.trim(),
    phone: addressForm.phone.trim(),
    city: addressForm.type === 'home' ? addressForm.city || null : null,
    district: addressForm.type === 'home' ? addressForm.district.trim() || null : null,
    address: addressForm.type === 'home' ? addressForm.address.trim() || null : null,
    is_default: addressForm.isDefault,
    store_name: addressForm.type === '711' ? addressForm.storeName.trim() || null : null,
    store_id: addressForm.type === '711' ? addressForm.storeId.trim() || null : null,
  })

  const handleSaveAddress = async () => {
    const validationMessage = validateAddressForm()

    if (validationMessage) {
      setAddressError(validationMessage)
      return
    }

    setIsSaving(true)
    setAddressError('')

    const payload = buildPayload()
    const newAddress = {
      id: editingAddress?.id || `addr-${Date.now()}`,
      type: payload.type,
      label: payload.label,
      name: payload.name,
      phone: payload.phone,
      city: payload.city,
      district: payload.district,
      address: payload.address,
      isDefault: payload.is_default,
      storeName: payload.store_name,
      storeId: payload.store_id,
      updatedAt: new Date().toISOString(),
    }

    if (editingAddress?.id) {
      setAddresses((prev) => prev.map((a) => (a.id === editingAddress.id ? newAddress : a)))
      toast.success('地址已更新。')
    } else {
      setAddresses((prev) => [...prev, newAddress])
      toast.success('地址已新增。')
    }

    closeAddressModal()
    setIsSaving(false)
  }

  const handleDeleteAddress = async (address) => {
    setIsDeletingId(address.id)
    setAddresses((prev) => prev.filter((a) => a.id !== address.id))
    toast.success('地址已刪除。')
    setIsDeletingId('')
  }

  return (
    <motion.div key="addresses" {...fadeUp}>
      <h2 className="account-section-title">
        <MapPin size={22} className="account-nav-icon" />
        收件地址
      </h2>

      {isLoading ? <LoadingSpinner size="medium" label="地址資料載入中..." /> : null}

      {!isLoading && error ? <ErrorState message={error} onRetry={fetchAddresses} /> : null}

      {!isLoading && !error && !sortedAddresses.length ? (
        <EmptyState
          icon={<MapPin size={28} className="account-nav-icon" />}
          title="目前沒有收件地址"
          description="新增常用收件地址後，結帳時可更快速帶入資料。"
          actionLabel="新增地址"
          onAction={openAddAddressModal}
        />
      ) : null}

      {!isLoading && !error ? (
        <div className="address-grid">
          {sortedAddresses.map((address) => (
            <article
              key={address.id}
              className={`address-card ${address.isDefault ? 'default' : ''}`}
            >
              {address.isDefault ? (
                <span className="address-default-badge">預設</span>
              ) : null}

              <div className={`address-type-badge type-${address.type}`}>
                {address.type === '711' ? '7-11 取貨' : '宅配地址'}
              </div>

              <div className="address-label">
                {address.type === '711' ? <Store size={14} /> : <MapPin size={14} />}
                <span>{address.label || '常用地址'}</span>
              </div>

              <div className="address-name">{address.name}</div>
              <div className="address-detail">{address.phone}</div>
              <div className="address-detail">{getAddressSummary(address)}</div>
              {address.type === '711' && address.storeId ? (
                <div className="address-detail">門市代碼：{address.storeId}</div>
              ) : null}

              <div className="address-actions">
                <button
                  type="button"
                  className="btn-address-action"
                  onClick={() => openEditAddressModal(address)}
                >
                  <Edit2 size={12} /> 編輯
                </button>
                <button
                  type="button"
                  className="btn-address-action"
                  onClick={() => handleDeleteAddress(address)}
                  disabled={isDeletingId === address.id}
                >
                  <Trash2 size={12} /> {isDeletingId === address.id ? '刪除中...' : '刪除'}
                </button>
              </div>
            </article>
          ))}

          <button type="button" className="btn-add-address" onClick={openAddAddressModal}>
            <Plus size={20} />
            <span>新增地址</span>
          </button>
        </div>
      ) : null}

      <AddressModal
        show={isAddressModalOpen}
        onClose={closeAddressModal}
        addressForm={addressForm}
        setAddressForm={setAddressForm}
        editingAddress={editingAddress}
        onSave={handleSaveAddress}
        addressError={addressError}
        isSaving={isSaving}
      />
    </motion.div>
  )
}
