import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, PawPrint, Plus, Trash2, X } from 'lucide-react'
import { EmptyState } from '../../../components/common'
import { useToast } from '../../../context/ToastContext'
import { usePets } from '../../../hooks/useMember'

const EMPTY_PET_FORM = {
  petName: '',
  petGender: '',
  petType: '',
  petBreed: '',
  petAge: '',
  petWeight: '',
  petBirthday: '',
  petAvatarUrl: '',
  petNote: '',
  petUid: '',
}

const PET_EMOJI = { cat: '🐱', dog: '🐶', other: '🐾' }
const PET_TYPE_LABEL = { cat: '貓咪', dog: '狗狗', other: '其他' }
const PET_GENDER_LABEL = { male: '公', female: '母' }

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const createPetUid = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `pet-${Date.now()}`
}

const mapPetToForm = (pet) => ({
  ...EMPTY_PET_FORM,
  petName: pet?.petName ?? pet?.name ?? '',
  petGender: pet?.petGender ?? pet?.gender ?? '',
  petType: pet?.petType ?? pet?.type ?? '',
  petBreed: pet?.petBreed ?? pet?.breed ?? '',
  petAge: pet?.petAge ?? (pet?.age ?? ''),
  petWeight: pet?.petWeight ?? (pet?.weight ?? ''),
  petBirthday: pet?.petBirthday ?? pet?.birthday ?? '',
  petAvatarUrl: pet?.petAvatarUrl ?? pet?.avatar_url ?? '',
  petNote: pet?.petNote ?? pet?.note ?? '',
  petUid: pet?.petUid ?? pet?.pet_uid ?? '',
})

const buildPetPayload = (petForm, existingPet) => ({
  pet_uid: petForm.petUid || existingPet?.pet_uid || createPetUid(),
  name: petForm.petName.trim(),
  type: petForm.petType || '',
  breed: petForm.petBreed.trim(),
  gender: petForm.petGender || '',
  birthday: petForm.petBirthday || '',
  age: petForm.petAge === '' ? null : Number(petForm.petAge),
  weight: petForm.petWeight === '' ? null : Number(petForm.petWeight),
  avatar_url: petForm.petAvatarUrl || '',
  note: petForm.petNote || '',
})

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
                    ].filter(Boolean).join('・') || '填寫更多資訊，建立完整毛孩檔案'}
                  </div>
                </div>
              </div>

              <div className="address-form">
                <div>
                  <label className="address-form-label">毛孩名稱 *</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="例如 Momo"
                    value={petForm.petName}
                    onChange={(e) => setPetForm((prev) => ({ ...prev, petName: e.target.value }))}
                  />
                </div>

                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">類型</label>
                    <select
                      className="apple-input select-input"
                      value={petForm.petType}
                      onChange={(e) => setPetForm((prev) => ({ ...prev, petType: e.target.value }))}
                    >
                      <option value="">請選擇</option>
                      <option value="cat">貓咪</option>
                      <option value="dog">狗狗</option>
                      <option value="other">其他</option>
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
                      <option value="male">公</option>
                      <option value="female">母</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="address-form-label">品種</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="例如 柴犬、英國短毛貓"
                    value={petForm.petBreed}
                    onChange={(e) => setPetForm((prev) => ({ ...prev, petBreed: e.target.value }))}
                  />
                </div>

                <div className="address-form-row">
                  <div>
                    <label className="address-form-label">年齡</label>
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
                      placeholder="例如 3.5"
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

              {petError && <div className="address-form-error">{petError}</div>}

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
  const toast = useToast()
  const {
    pets,
    loading,
    add: addPetApi,
    update: updatePetApi,
    remove: removePetApi,
  } = usePets()

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
    setPetForm(mapPetToForm(pet))
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

  const handleSavePet = async () => {
    try {
      const error = validatePetForm()
      if (error) {
        setPetError(error)
        return
      }

      const petData = buildPetPayload(petForm, editingPet)

      if (editingPet) {
        await updatePetApi(editingPet.id, petData)
        toast.success('毛孩資料已更新')
      } else {
        await addPetApi(petData)
        toast.success('毛孩資料已新增')
      }

      closePetModal()
    } catch (err) {
      toast.error(err?.message || '操作失敗，請稍後再試')
    }
  }

  const handleDeletePet = async (id) => {
    try {
      if (!window.confirm('確定要刪除此毛孩資料嗎？')) return
      await removePetApi(id)
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

      {!loading && pets.length === 0 ? (
        <EmptyState
          className="account-empty-state"
          icon="🐾"
          title="目前還沒有毛孩資料"
          description="新增毛孩後，可以在會員中心更方便管理生日、品種與基本資訊。"
          actionLabel="新增毛孩"
          onAction={openAddPetModal}
        />
      ) : (
        <div className="address-grid">
          {pets.map((pet) => {
            const petView = mapPetToForm(pet)

            return (
              <div key={pet.id} className="address-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 32, lineHeight: 1 }}>
                    {PET_EMOJI[petView.petType] || '🐾'}
                  </span>
                  <div>
                    <div className="address-name">{petView.petName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray-dark)', marginTop: 2 }}>
                      {PET_TYPE_LABEL[petView.petType] || '未分類'}
                      {petView.petBreed && ` ・ ${petView.petBreed}`}
                    </div>
                  </div>
                </div>

                <div
                  className="address-detail"
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 12 }}
                >
                  {petView.petGender && <span>{PET_GENDER_LABEL[petView.petGender] || petView.petGender}</span>}
                  {petView.petAge && <span>{petView.petAge} 歲</span>}
                  {petView.petWeight && <span>{petView.petWeight} kg</span>}
                  {petView.petBirthday && <span>{petView.petBirthday}</span>}
                  {!petView.petGender && !petView.petAge && !petView.petWeight && !petView.petBirthday && (
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
            )
          })}

          <button className="btn-add-address" onClick={openAddPetModal}>
            <Plus size={24} />
            新增毛孩
          </button>
        </div>
      )}
    </motion.div>
  )
}
