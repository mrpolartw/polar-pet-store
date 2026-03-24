import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Handshake,
  Mail,
  Newspaper,
  Paperclip,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import LogoImg from '../png/LOGO.png'
import './Auth/Auth.css'
import './Contact.css'

const CONTACT_STEPS = ['身份確認', '問題描述', '確認送出']

const PROBLEM_TYPES = {
  consumer: ['訂單問題', '退換貨', '商品諮詢', '帳號問題', '配送問題', '其他'],
  partner: ['合作提案', '代理經銷', '媒體授權', '其他'],
  media: ['採訪申請', '形象授權', '公關合作', '其他'],
  other: ['一般詢問', '建議回饋', '其他'],
}

const IDENTITY_OPTIONS = [
  { key: 'consumer', label: '一般消費者', icon: UserRound },
  { key: 'partner', label: '企業合作', icon: Handshake },
  { key: 'media', label: '媒體採訪', icon: Newspaper },
  { key: 'other', label: '其他', icon: FileText },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 3
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const slideVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

const STEP_META = {
  0: {
    title: '嗨，先認識一下你',
    description: '讓我們知道你是誰，這樣我們比較知道怎麼回你。',
  },
  1: {
    title: '告訴我們發生了什麼',
    description: '不用完美，把情況說清楚就好，我們會從這裡開始幫你。',
  },
  2: {
    title: '看起來都對嗎？',
    description: '最後再看一眼。沒問題就送出，我們就開始處理。',
  },
}

const createReferenceNumber = () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  return `CS${y}${m}${d}-${suffix}`
}

const formatFileSize = (size) => {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getInitialForm = (user) => ({
  identity: '',
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  companyName: '',
  jobTitle: '',
  taxId: '',
  problemType: '',
  subject: '',
  message: '',
  attachments: [],
  agreePrivacy: false,
})

const Contact = () => {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedReference, setSubmittedReference] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState(getInitialForm(user))

  const currentTypeOptions = PROBLEM_TYPES[form.identity] || PROBLEM_TYPES.other
  const showBusinessFields = form.identity === 'partner' || form.identity === 'media'
  const identityLabel =
    IDENTITY_OPTIONS.find((option) => option.key === form.identity)?.label || '未選擇'

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleIdentityChange = (identity) => {
    setForm((prev) => ({
      ...prev,
      identity,
      problemType: '',
    }))
    setErrors((prev) => ({
      ...prev,
      identity: '',
      problemType: '',
      companyName: '',
      jobTitle: '',
      taxId: '',
    }))
  }

  const mergeAttachments = (incomingFiles) => {
    const files = Array.from(incomingFiles)
    if (!files.length) return

    const invalidType = files.find((file) => !ALLOWED_TYPES.includes(file.type))
    if (invalidType) {
      setErrors((prev) => ({ ...prev, attachments: '附件格式還不符合，目前支援 JPG、PNG 或 PDF' }))
      return
    }

    const invalidSize = files.find((file) => file.size > MAX_FILE_SIZE)
    if (invalidSize) {
      setErrors((prev) => ({ ...prev, attachments: '單一附件再小一點會更順利，請控制在 10MB 內' }))
      return
    }

    setForm((prev) => {
      const merged = [...prev.attachments]

      files.forEach((file) => {
        const exists = merged.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        )

        if (!exists) merged.push(file)
      })

      if (merged.length > MAX_FILES) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          attachments: `附件先上傳 ${MAX_FILES} 個就好，我們比較好開始處理`,
        }))
        return prev
      }

      return { ...prev, attachments: merged }
    })

    setErrors((prev) => ({ ...prev, attachments: '' }))
  }

  const removeAttachment = (index) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, fileIndex) => fileIndex !== index),
    }))
  }

  const validateStep0 = () => {
    const nextErrors = {}

    if (!form.identity) nextErrors.identity = '先選一個身份，我們比較知道怎麼接住你'
    if (!form.name.trim()) nextErrors.name = '需要填寫姓名才能繼續'
    if (!form.email.trim()) nextErrors.email = '需要留下 Email，我們才能回你'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = '這個 Email 看起來格式不太對，再幫我們確認一下'

    if (form.phone.trim() && !/^09\d{8}$/.test(form.phone.trim())) {
      nextErrors.phone = '手機號碼看起來不太對，請確認是否為 09 開頭的 10 碼'
    }

    if (showBusinessFields && !form.companyName.trim()) nextErrors.companyName = '需要填寫公司名稱，方便我們安排窗口'
    if (showBusinessFields && !form.jobTitle.trim()) nextErrors.jobTitle = '需要填寫職稱，方便我們安排對接'
    if (form.taxId.trim() && !/^\d{8}$/.test(form.taxId.trim())) nextErrors.taxId = '統一編號格式看起來不太對，請確認是否為 8 碼'

    return nextErrors
  }

  const validateStep1 = () => {
    const nextErrors = {}

    if (!form.problemType) nextErrors.problemType = '先選一個問題類型，我們比較知道怎麼接住你'
    if (!form.subject.trim()) nextErrors.subject = '需要填寫主旨，讓我們先快速理解狀況'
    else if (form.subject.trim().length > 80) nextErrors.subject = '主旨有點長了，精簡到 80 個字內就可以'

    if (!form.message.trim()) nextErrors.message = '需要填寫訊息內容，我們才能開始幫你'
    else if (form.message.trim().length > 1000) nextErrors.message = '訊息有點長了，整理到 1000 個字內就可以'

    return nextErrors
  }

  const validateStep2 = () => {
    const nextErrors = {}

    if (!form.agreePrivacy) nextErrors.agreePrivacy = '送出前，請先閱讀並同意隱私權政策'

    return nextErrors
  }

  const handleNext = () => {
    const nextErrors = step === 0 ? validateStep0() : validateStep1()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setStep((prev) => prev + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateStep2()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setSubmittedReference(createReferenceNumber())
    setIsSubmitting(false)
    setStep(3)
  }

  const handleReset = () => {
    setStep(0)
    setForm(getInitialForm(user))
    setErrors({})
    setSubmittedReference('')
    setIsSubmitting(false)
    setIsDragActive(false)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const reviewItems = [
    { label: '身份', value: identityLabel },
    { label: '姓名', value: form.name },
    { label: 'Email', value: form.email },
    { label: '手機', value: form.phone || '未填寫' },
    { label: '問題類型', value: form.problemType },
    { label: '主旨', value: form.subject },
    { label: '附件', value: form.attachments.length ? `${form.attachments.length} 個檔案` : '無' },
  ]

  return (
    <main className="auth-page contact-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <Link to="/">
            <img
              src={LogoImg}
              alt="Mr.Polar 北極先生"
              style={{
                height: 'auto',
                width: 293,
                maxWidth: '100%',
                display: 'block',
                borderRadius: 14,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            />
          </Link>
        </div>

        <div className="auth-brand-content">
          <h2>Mr.Polar — 我們在這裡</h2>
          <p>每一則留言，我們都認真對待</p>
        </div>

        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Mail size={16} /></div>
            <span>真人團隊，不是機器人</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Handshake size={16} /></div>
            <span>歡迎品牌夥伴一起談</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><ShieldCheck size={16} /></div>
            <span>你的資料，我們好好保管</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container contact-form-container">
          <div className="auth-mobile-logo">
            <Link to="/">
              <img
                src={LogoImg}
                alt="Mr.Polar 北極先生"
                style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block' }}
              />
            </Link>
          </div>

          {step < 3 && (
            <>
              <div className="auth-steps">
                {CONTACT_STEPS.map((label, i) => (
                  <div key={i} className="auth-step-item">
                    <div className={`auth-step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
                    <span className={`auth-step-label ${i === step ? 'active' : ''}`}>{label}</span>
                  </div>
                ))}
              </div>

              <div className="auth-header">
                <h1>{STEP_META[step].title}</h1>
                <p>{STEP_META[step].description}</p>
              </div>
            </>
          )}

          {step < 3 ? (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="step0"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    <section className="contact-section">
                      <div className="contact-section-head">
                        <span className="contact-section-step">A</span>
                        <div>
                          <h2>你是？</h2>
                          <p>選一個最接近的身份就好，不用太精確。</p>
                        </div>
                      </div>

                      <div className="contact-identity-grid">
                        {IDENTITY_OPTIONS.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            className={`contact-identity-btn ${form.identity === option.key ? 'active' : ''}`}
                            onClick={() => handleIdentityChange(option.key)}
                          >
                            <option.icon size={18} />
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                      {errors.identity && <p className="auth-field-error"><AlertCircle size={12} />{errors.identity}</p>}
                    </section>

                    <section className="contact-section">
                      <div className="contact-section-head">
                        <span className="contact-section-step">B</span>
                        <div>
                          <h2>怎麼聯絡你？</h2>
                          <p>我們回覆時會用到，不會做其他用途。</p>
                        </div>
                      </div>

                      <div className="auth-row-half">
                        <div className="auth-field">
                          <label htmlFor="contact-name">姓名（必填）</label>
                          <input
                            id="contact-name"
                            type="text"
                            className="apple-input"
                            placeholder="請輸入姓名"
                            value={form.name}
                            onChange={(event) => setField('name', event.target.value)}
                          />
                          {errors.name && <p className="auth-field-error"><AlertCircle size={12} />{errors.name}</p>}
                        </div>

                        <div className="auth-field">
                          <label htmlFor="contact-email">Email（必填）</label>
                          <input
                            id="contact-email"
                            type="email"
                            className="apple-input"
                            placeholder="name@example.com"
                            value={form.email}
                            onChange={(event) => setField('email', event.target.value)}
                          />
                          {errors.email && <p className="auth-field-error"><AlertCircle size={12} />{errors.email}</p>}
                        </div>
                      </div>

                      <div className="auth-row-half">
                        <div className="auth-field">
                          <label htmlFor="contact-phone">手機號碼（選填）</label>
                          <input
                            id="contact-phone"
                            type="tel"
                            className="apple-input"
                            placeholder="0912345678"
                            maxLength={10}
                            value={form.phone}
                            onChange={(event) => setField('phone', event.target.value.replace(/\D/g, ''))}
                          />
                          {errors.phone && <p className="auth-field-error"><AlertCircle size={12} />{errors.phone}</p>}
                        </div>

                        <div className="contact-spacer" aria-hidden="true" />
                      </div>

                      <AnimatePresence initial={false}>
                        {showBusinessFields && (
                          <motion.div
                            key="business-fields"
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="contact-motion-block"
                          >
                            <div className="auth-row-half">
                              <div className="auth-field">
                                <label htmlFor="contact-company">公司名稱（必填）</label>
                                <input
                                  id="contact-company"
                                  type="text"
                                  className="apple-input"
                                  placeholder="請輸入公司名稱"
                                  value={form.companyName}
                                  onChange={(event) => setField('companyName', event.target.value)}
                                />
                                {errors.companyName && <p className="auth-field-error"><AlertCircle size={12} />{errors.companyName}</p>}
                              </div>

                              <div className="auth-field">
                                <label htmlFor="contact-job-title">職稱（必填）</label>
                                <input
                                  id="contact-job-title"
                                  type="text"
                                  className="apple-input"
                                  placeholder="請輸入職稱"
                                  value={form.jobTitle}
                                  onChange={(event) => setField('jobTitle', event.target.value)}
                                />
                                {errors.jobTitle && <p className="auth-field-error"><AlertCircle size={12} />{errors.jobTitle}</p>}
                              </div>
                            </div>

                            <div className="auth-row-half">
                              <div className="auth-field">
                                <label htmlFor="contact-tax-id">統一編號</label>
                                <input
                                  id="contact-tax-id"
                                  type="text"
                                  className="apple-input"
                                  placeholder="請輸入 8 碼統一編號"
                                  maxLength={8}
                                  value={form.taxId}
                                  onChange={(event) => setField('taxId', event.target.value.replace(/\D/g, ''))}
                                />
                                {errors.taxId && <p className="auth-field-error"><AlertCircle size={12} />{errors.taxId}</p>}
                              </div>

                              <div className="contact-spacer" aria-hidden="true" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    <button type="button" className="btn-blue auth-submit-btn" onClick={handleNext}>
                      繼續 <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </button>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    <section className="contact-section">
                      <div className="contact-section-head">
                        <span className="contact-section-step">C</span>
                        <div>
                          <h2>關於什麼事？</h2>
                          <p>選一個最接近的類型，方便我們找對人回覆。</p>
                        </div>
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={form.identity || 'default'}
                          className="contact-type-panel"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="contact-pill-group">
                            {currentTypeOptions.map((type) => (
                              <button
                                key={type}
                                type="button"
                                className={`contact-pill ${form.problemType === type ? 'active' : ''}`}
                                onClick={() => setField('problemType', type)}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {errors.problemType && <p className="auth-field-error"><AlertCircle size={12} />{errors.problemType}</p>}
                    </section>

                    <section className="contact-section">
                      <div className="contact-section-head">
                        <span className="contact-section-step">D</span>
                        <div>
                          <h2>說說詳情</h2>
                          <p>主旨簡短說明，下方留白處放細節，多寫無妨。</p>
                        </div>
                      </div>

                      <div className="auth-field">
                        <div className="contact-counter-row">
                          <label htmlFor="contact-subject">主旨（必填）</label>
                          <span>{form.subject.length} / 80</span>
                        </div>
                        <input
                          id="contact-subject"
                          type="text"
                          className="apple-input"
                          placeholder="用一句話說明你的問題"
                          maxLength={80}
                          value={form.subject}
                          onChange={(event) => setField('subject', event.target.value)}
                        />
                        {errors.subject && <p className="auth-field-error"><AlertCircle size={12} />{errors.subject}</p>}
                      </div>

                      <div className="auth-field" style={{ marginBottom: 0 }}>
                        <div className="contact-counter-row">
                          <label htmlFor="contact-message">訊息內容（必填）</label>
                          <span>{form.message.length} / 1000</span>
                        </div>
                        <textarea
                          id="contact-message"
                          className="apple-input contact-textarea"
                          placeholder="可以描述發生的情況、想詢問的內容，或任何想讓我們知道的事…"
                          maxLength={1000}
                          value={form.message}
                          onChange={(event) => setField('message', event.target.value)}
                        />
                        {errors.message && <p className="auth-field-error"><AlertCircle size={12} />{errors.message}</p>}
                      </div>
                    </section>

                    <section className="contact-section">
                      <div className="contact-section-head">
                        <span className="contact-section-step">E</span>
                        <div>
                          <h2>有圖有真相（選填）</h2>
                          <p>若有截圖或相關檔案，一起傳給我們更有幫助。</p>
                        </div>
                      </div>

                      <div className="auth-field" style={{ marginBottom: 0 }}>
                        <div
                          className={`contact-upload-zone ${isDragActive ? 'is-drag-active' : ''}`}
                          onDragOver={(event) => {
                            event.preventDefault()
                            setIsDragActive(true)
                          }}
                          onDragLeave={(event) => {
                            event.preventDefault()
                            setIsDragActive(false)
                          }}
                          onDrop={(event) => {
                            event.preventDefault()
                            setIsDragActive(false)
                            mergeAttachments(event.dataTransfer.files)
                          }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            multiple
                            className="contact-upload-input"
                            onChange={(event) => {
                              mergeAttachments(event.target.files)
                              event.target.value = ''
                            }}
                          />

                          <div className="contact-upload-icon">
                            <UploadCloud size={22} />
                          </div>

                          <h3>把檔案拖進來，或點這裡選擇</h3>
                          <p>JPG · PNG · PDF，每個不超過 10MB，最多 3 個</p>

                          <button
                            type="button"
                            className="contact-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip size={16} />
                            選擇檔案
                          </button>
                        </div>

                        {errors.attachments && <p className="auth-field-error"><AlertCircle size={12} />{errors.attachments}</p>}

                        {form.attachments.length > 0 && (
                          <div className="contact-file-list">
                            {form.attachments.map((file, index) => (
                              <div key={`${file.name}-${file.lastModified}-${index}`} className="contact-file-item">
                                <div className="contact-file-meta">
                                  <FileText size={18} />
                                  <div>
                                    <strong>{file.name}</strong>
                                    <span>{formatFileSize(file.size)}</span>
                                  </div>
                                </div>

                                <button type="button" onClick={() => removeAttachment(index)} aria-label={`移除 ${file.name}`}>
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        style={{
                          flex: '0 0 48px',
                          padding: '16px',
                          borderRadius: 12,
                          border: '1.5px solid var(--color-gray-light)',
                          background: 'var(--color-bg-white)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-gray-dark)',
                        }}
                        aria-label="返回上一步"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <button type="button" className="btn-blue auth-submit-btn" onClick={handleNext} style={{ flex: 1, marginBottom: 0 }}>
                        下一步 <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    <section className="contact-section">
                      <div className="contact-section-head">
                        <span className="contact-section-step">F</span>
                        <div>
                          <h2>你填寫的資訊</h2>
                          <p>如有需要修改，直接點左側返回即可。</p>
                        </div>
                      </div>

                      <div className="contact-type-panel" style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
                        {reviewItems.map((item, index) => (
                          <div
                            key={item.label}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '108px 1fr',
                              gap: 16,
                              alignItems: 'start',
                              padding: '12px 0',
                              borderBottom: index < reviewItems.length - 1 ? '1px solid var(--color-gray-light)' : 'none',
                            }}
                          >
                            <strong
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--color-gray-dark)',
                              }}
                            >
                              {item.label}
                            </strong>
                            <span
                              style={{
                                fontSize: 15,
                                lineHeight: 1.7,
                                color: 'var(--color-text-dark)',
                                wordBreak: 'break-word',
                              }}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="auth-terms contact-privacy">
                        <input
                          type="checkbox"
                          id="contact-agree-privacy"
                          checked={form.agreePrivacy}
                          onChange={(event) => setField('agreePrivacy', event.target.checked)}
                        />
                        <label htmlFor="contact-agree-privacy">
                          我已閱讀 <Link to="/privacy">隱私權政策</Link>，同意北極先生依此處理我的資料
                        </label>
                      </div>
                      {errors.agreePrivacy && <p className="auth-field-error"><AlertCircle size={12} />{errors.agreePrivacy}</p>}

                      <div className="contact-ssl-note" style={{ marginBottom: 0 }}>
                        <ShieldCheck size={18} />
                        <span>你的資料會用 256-bit SSL 加密傳輸，北極先生不會對外分享</span>
                      </div>
                    </section>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                          flex: '0 0 48px',
                          padding: '16px',
                          borderRadius: 12,
                          border: '1.5px solid var(--color-gray-light)',
                          background: 'var(--color-bg-white)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-gray-dark)',
                        }}
                        aria-label="返回上一步"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <button type="submit" className="btn-blue auth-submit-btn" disabled={isSubmitting} style={{ flex: 1, marginBottom: 0 }}>
                        {isSubmitting ? <><span className="auth-spinner" />處理中...</> : '送出訊息'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          ) : (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="auth-success-box contact-success-box">
                <div className="success-icon">🐾</div>
                <h3>已經收到了！</h3>
                <p>
                  謝謝你告訴我們。<br />
                  我們會在 <strong>1–3 個工作天</strong>內回覆，
                  有急事也可以直接找我們的 LINE。
                </p>
              </div>

              <div className="contact-reference-card">
                <div className="contact-reference-label">你的諮詢編號</div>
                <div className="contact-reference-value">{submittedReference}</div>
                <div className="contact-reference-help">我們回覆時會帶上這組編號，方便你對照。</div>
              </div>

              <div className="contact-success-actions">
                <Link
                  to="/"
                  className="btn-blue auth-submit-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  回首頁
                </Link>
                <p className="auth-switch">
                  <button type="button" onClick={handleReset}>還有問題？再寫一封</button>
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}

export default Contact
