import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, PawPrint, Plus, Trash2, X } from 'lucide-react'
import { EmptyState } from '../../../components/common'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'

const EMPTY_PET_FORM = {
  petName: '',
  petGender: '',
  petType: '',
  petBreed: '',
  petAge: '',
  petWeight: '',
  petBirthday: '',
}

const PET_EMOJI = { cat: '🐱', dog: '🐶', other: '🐾' }
const PET_TYPE_LABEL = { cat: '貓咪', dog: '狗狗', other: '其他' }
const PET_GENDER_LABEL = { male: '男生', female: '女生' }

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

function PetModal({ show, onClose, petForm, setPetForm, editingPet, onSave, petError }) {
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
                  {editingPet ? '編輯毛孩資料' : '新增毛孩資料'}
                </h3>
                <button className="address-modal-close" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>

              <div className="pet-modal-preview">
                <div className="pet-modal-preview-info">
                  <div className="pet-modal-preview-name">{petForm.petName || '毛孩名字'}</div>
                  <div className="pet-modal-preview-sub">
                    {[
                      PET_TYPE_LABEL[petForm.petType],
                      petForm.petBreed,
                      PET_GENDER_LABEL[petForm.petGender],
                    ].filter(Boolean).join(' · ') || '請填寫毛孩資訊'}
                  </div>
                </div>
              </div>

              <div className="address-form">
                <div>
                  <label className="address-form-label">毛孩名稱 *</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="例如：Momo"
                    value={petForm.petName}
                    onChange={(e) => setPetForm((prev) => ({ ...prev, petName: e.target.value }))}
                  />
                </div>

                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">種類</label>
                    <select
                      className="apple-input select-input"
                      value={petForm.petType}
                      onChange={(e) => setPetForm((prev) => ({ ...prev, petType: e.target.value }))}
                    >
                      <option value="">請選擇</option>
                      <option value="cat">貓咪</option>
                      <option value="dog">狗狗</option>
                    </select>
                  </div>
                  <div>
                    <label className="address-form-label">性別</label>
                    <select
                      className="apple-input select-input"
                      value={petForm.petGender}
                      onChange={(e) => setPetForm((prev) => ({ ...prev, petGender: e.target.value }))}
                    >
                      <option value="">請選擇</option>
                      <option value="male">男生</option>
                      <option value="female">女生</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="address-form-label">品種</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="例如：米克斯、英國短毛貓"
                    value={petForm.petBreed}
                    onChange={(e) => setPetForm((prev) => ({ ...prev, petBreed: e.target.value }))}
                  />
                </div>

                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">年齡（歲）</label>
                    <input
                      type="number"
                      className="apple-input"
                      placeholder="3"
                      min="0"
                      max="30"
                      value={petForm.petAge}
                      onChange={(e) => setPetForm((prev) => ({ ...prev, petAge: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="address-form-label">體重（kg）</label>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="例如：3.5"
                      value={petForm.petWeight}
                      onChange={(e) => setPetForm((prev) => ({ ...prev, petWeight: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="address-form-label">生日</label>
                  <input
                    type="date"
                    className="apple-input"
                    value={petForm.petBirthday}
                    onChange={(e) => setPetForm((prev) => ({ ...prev, petBirthday: e.target.value }))}
                  />
                </div>
              </div>

              {petError && <div className="address-form-error">提示：{petError}</div>}

              <div className="address-modal-actions">
                <button className="btn-modal-cancel" onClick={onClose}>取消</button>
                <button className="btn-blue btn-modal-submit" onClick={onSave}>
                  {editingPet ? '儲存變更' : '新增毛孩'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function AccountPets() {
  const { user } = useAuth()
  const toast = useToast()

  const [pets, setPets] = useState(
    user?.pets?.map((pet, index) => ({ ...pet, id: pet.id || index + 1 })) || [],
  )
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)
  const [petForm, setPetForm] = useState(EMPTY_PET_FORM)
  const [editingPet, setEditingPet] = useState(null)
  const [petError, setPetError] = useState('')

  const openAddPetModal = () => {
    setPetForm(EMPTY_PET_FORM)
    setEditingPet(null)
    setPetError('')
    setIsPetModalOpen(true)
  }

  const openEditPetModal = (pet) => {
    setPetForm({ ...EMPTY_PET_FORM, ...pet })
    setEditingPet(pet)
    setPetError('')
    setIsPetModalOpen(true)
  }

  const closePetModal = () => {
    setIsPetModalOpen(false)
    setPetError('')
  }

  const validatePetForm = () => {
    if (!petForm.petName.trim()) return '請輸入毛孩名稱'
    if (petForm.petWeight && Number.isNaN(Number(petForm.petWeight))) return '體重請輸入數字，例如 3.5'
    return ''
  }

  const handleSavePet = () => {
    try {
      const error = validatePetForm()
      if (error) {
        setPetError(error)
        return
      }

      if (editingPet) {
        setPets((prev) => prev.map((pet) => (
          pet.id === editingPet.id ? { ...pet, ...petForm } : pet
        )))
        toast.success('毛孩資料已更新')
      } else {
        setPets((prev) => [...prev, { ...petForm, id: Date.now() }])
        toast.success('毛孩已新增')
      }

      closePetModal()
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  const handleDeletePet = (id) => {
    try {
      if (!window.confirm('確定要刪除此毛孩資料嗎？')) return
      setPets((prev) => prev.filter((pet) => pet.id !== id))
      toast.success('毛孩資料已刪除')
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  return (
    <motion.div key="pets" {...fadeUp}>
      <h2 className="account-section-title">
        <PawPrint size={22} className="account-nav-icon" />
        我的毛孩
      </h2>

      <PetModal
        show={isPetModalOpen}
        onClose={closePetModal}
        petForm={petForm}
        setPetForm={setPetForm}
        editingPet={editingPet}
        onSave={handleSavePet}
        petError={petError}
      />

      {pets.length === 0 ? (
        <EmptyState
          className="account-empty-state"
          icon="🐾"
          title="目前還沒有毛孩資料"
          description="新增毛孩後，我們能提供更符合需求的商品推薦。"
          actionLabel="新增毛孩"
          onAction={openAddPetModal}
        />
      ) : (
        <div className="address-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="address-card">
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

              <div
                className="address-detail"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 12 }}
              >
                {pet.petGender && <span>{PET_GENDER_LABEL[pet.petGender]}</span>}
                {pet.petAge && <span>{pet.petAge} 歲</span>}
                {pet.petWeight && <span>{pet.petWeight} kg</span>}
                {pet.petBirthday && <span>{pet.petBirthday}</span>}
                {!pet.petGender && !pet.petAge && !pet.petWeight && !pet.petBirthday && (
                  <span style={{ color: 'var(--color-gray-dark)', fontStyle: 'italic' }}>尚未填寫更多資訊</span>
                )}
              </div>

              <div className="address-actions">
                <button className="btn-address-action" onClick={() => openEditPetModal(pet)}>
                  <Edit2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                  編輯
                </button>
                <button
                  className="btn-address-action"
                  style={{ color: '#e74c3c' }}
                  onClick={() => handleDeletePet(pet.id)}
                >
                  <Trash2 size={12} style={{ display: 'inline' }} />
                </button>
              </div>
            </div>
          ))}

          <button className="btn-add-address" onClick={openAddPetModal}>
            <Plus size={24} />
            新增毛孩
          </button>
        </div>
      )}
    </motion.div>
  )
}
