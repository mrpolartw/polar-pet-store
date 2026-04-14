import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, Loader2, PawPrint, Plus, Trash2, X } from 'lucide-react'

import { EmptyState } from '../../../components/common'
import { useToast } from '../../../context/ToastContext'
import membershipService from '../../../services/membershipService'

const EMPTY_PET_FORM = {
  name: '',
  species: '',
  breed: '',
  birthday: '',
  gender: '',
  weight: '',
}

const PET_TYPE_LABEL = { cat: '貓', dog: '狗', bird: '鳥', other: '其他' }
const PET_GENDER_LABEL = { male: '男孩', female: '女孩' }

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

function toFormState(pet) {
  return {
    name: pet?.name ?? '',
    species: pet?.species ?? '',
    breed: pet?.breed ?? '',
    birthday: pet?.birthday ? String(pet.birthday).slice(0, 10) : '',
    gender: pet?.gender ?? '',
    weight: String(pet?.metadata?.weight ?? ''),
  }
}

function buildPayload(form) {
  return {
    name: form.name.trim(),
    species: form.species || null,
    breed: form.breed.trim() || null,
    birthday: form.birthday || null,
    gender: form.gender || undefined,
    metadata: form.weight ? { weight: Number(form.weight) } : null,
  }
}

function PetModal({ open, onClose, form, setForm, onSubmit, submitting, editing, error }) {
  return (
    <AnimatePresence>
      {open ? (
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
                  {editing ? '編輯毛孩資料' : '新增毛孩資料'}
                </h3>
                <button className="address-modal-close" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>

              <div className="address-form">
                <div>
                  <label className="address-form-label">毛孩姓名 *</label>
                  <input
                    type="text"
                    className="apple-input"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="請輸入毛孩名字"
                  />
                </div>

                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">種類</label>
                    <select
                      className="apple-input select-input"
                      value={form.species}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, species: event.target.value }))
                      }
                    >
                      <option value="">請選擇</option>
                      <option value="cat">貓</option>
                      <option value="dog">狗</option>
                      <option value="bird">鳥</option>
                      <option value="other">其他</option>
                    </select>
                  </div>

                  <div>
                    <label className="address-form-label">性別</label>
                    <select
                      className="apple-input select-input"
                      value={form.gender}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, gender: event.target.value }))
                      }
                    >
                      <option value="">請選擇</option>
                      <option value="male">男孩</option>
                      <option value="female">女孩</option>
                    </select>
                  </div>
                </div>

                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">品種</label>
                    <input
                      type="text"
                      className="apple-input"
                      value={form.breed}
                      onChange={(event) => setForm((prev) => ({ ...prev, breed: event.target.value }))}
                      placeholder="例如：米克斯、柴犬"
                    />
                  </div>

                  <div>
                    <label className="address-form-label">體重（kg）</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="apple-input"
                      value={form.weight}
                      onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
                      placeholder="例如：4.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="address-form-label">生日</label>
                  <input
                    type="date"
                    className="apple-input"
                    value={form.birthday}
                    onChange={(event) => setForm((prev) => ({ ...prev, birthday: event.target.value }))}
                  />
                </div>
              </div>

              {error ? <div className="address-form-error">{error}</div> : null}

              <div className="address-modal-actions">
                <button className="btn-modal-cancel" onClick={onClose}>
                  取消
                </button>
                <button className="btn-blue btn-modal-submit" onClick={onSubmit} disabled={submitting}>
                  {submitting ? '儲存中...' : editing ? '更新毛孩' : '新增毛孩'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export default function AccountPets() {
  const toast = useToast()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const [form, setForm] = useState(EMPTY_PET_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const loadPets = useCallback(
    async (activeRef = { current: true }) => {
      setLoading(true)
      setLoadError('')

      try {
        const response = await membershipService.getCustomerPets()
        if (!activeRef.current) return
        setPets(response.items)
      } catch (err) {
        if (!activeRef.current) return
        const message = err?.message || '毛孩資料載入失敗，請稍後再試。'
        setLoadError(message)
        toast.error(message)
      } finally {
        if (activeRef.current) {
          setLoading(false)
        }
      }
    },
    [toast]
  )

  useEffect(() => {
    const activeRef = { current: true }
    void loadPets(activeRef)

    return () => {
      activeRef.current = false
    }
  }, [loadPets])

  const openCreateModal = () => {
    setEditingPet(null)
    setForm(EMPTY_PET_FORM)
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (pet) => {
    setEditingPet(pet)
    setForm(toFormState(pet))
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
  }

  const validateForm = () => {
    if (!form.name.trim()) return '請輸入毛孩姓名。'
    if (form.weight && Number.isNaN(Number(form.weight))) return '請輸入正確的體重數字。'
    return ''
  }

  const handleSubmit = async () => {
    const nextError = validateForm()
    if (nextError) {
      setFormError(nextError)
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const payload = buildPayload(form)
      const response = editingPet
        ? await membershipService.updateCustomerPet(editingPet.id, payload)
        : await membershipService.createCustomerPet(payload)
      const pet = response?.pet ?? null

      if (!pet) {
        throw new Error('毛孩資料儲存失敗。')
      }

      setPets((prev) => {
        if (editingPet) {
          return prev.map((item) => (item.id === pet.id ? pet : item))
        }

        return [pet, ...prev]
      })

      toast.success(editingPet ? '毛孩資料已更新。' : '毛孩資料已新增。')
      setModalOpen(false)
    } catch (err) {
      setFormError(err?.message || '毛孩資料儲存失敗，請稍後再試。')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (pet) => {
    if (!window.confirm(`確定要刪除 ${pet.name} 的資料嗎？`)) {
      return
    }

    setDeletingId(pet.id)
    try {
      await membershipService.deleteCustomerPet(pet.id)
      setPets((prev) => prev.filter((item) => item.id !== pet.id))
      toast.success('毛孩資料已刪除。')
    } catch (err) {
      toast.error(err?.message || '刪除毛孩資料失敗，請稍後再試。')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <motion.div key="pets" {...fadeUp}>
      <h2 className="account-section-title">
        <PawPrint size={22} className="account-nav-icon" />
        毛孩資料
      </h2>

      <PetModal
        open={modalOpen}
        onClose={closeModal}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        editing={Boolean(editingPet)}
        error={formError}
      />

      {loading ? (
        <div className="account-empty-state">
          <Loader2 size={28} className="animate-spin" />
          <p style={{ marginTop: 12 }}>毛孩資料載入中...</p>
        </div>
      ) : loadError ? (
        <EmptyState
          className="account-empty-state"
          icon={<PawPrint size={36} />}
          title="毛孩資料載入失敗"
          description={loadError}
          actionLabel="重新載入"
          onAction={() => void loadPets()}
        />
      ) : pets.length === 0 ? (
        <EmptyState
          className="account-empty-state"
          icon="🐾"
          title="目前沒有毛孩資料"
          description="新增毛孩後，之後就能更完整地管理毛孩資訊。"
          actionLabel="新增毛孩"
          onAction={openCreateModal}
        />
      ) : (
        <div className="address-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="address-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 30 }}>🐾</span>
                <div>
                  <div className="address-name">{pet.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-gray-dark)', marginTop: 2 }}>
                    {[PET_TYPE_LABEL[pet.species], pet.breed].filter(Boolean).join('｜') ||
                      '尚未填寫種類與品種'}
                  </div>
                </div>
              </div>

              <div
                className="address-detail"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 12 }}
              >
                {pet.gender ? <span>{PET_GENDER_LABEL[pet.gender] ?? pet.gender}</span> : null}
                {pet.metadata?.weight ? <span>{pet.metadata.weight} kg</span> : null}
                {pet.birthday ? <span>{String(pet.birthday).slice(0, 10)}</span> : null}
                {!pet.gender && !pet.metadata?.weight && !pet.birthday ? (
                  <span style={{ color: 'var(--color-gray-dark)', fontStyle: 'italic' }}>
                    尚未填寫更多資料
                  </span>
                ) : null}
              </div>

              <div className="address-actions">
                <button className="btn-address-action" onClick={() => openEditModal(pet)}>
                  <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                  編輯
                </button>
                <button
                  className="btn-address-action"
                  style={{ color: '#e74c3c' }}
                  onClick={() => handleDelete(pet)}
                  disabled={deletingId === pet.id}
                >
                  {deletingId === pet.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} style={{ display: 'inline' }} />
                  )}
                </button>
              </div>
            </div>
          ))}

          <button className="btn-add-address" onClick={openCreateModal}>
            <Plus size={24} />
            新增毛孩
          </button>
        </div>
      )}
    </motion.div>
  )
}
