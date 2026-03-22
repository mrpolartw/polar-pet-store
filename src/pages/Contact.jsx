import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  Building2,
  FileText,
  Handshake,
  Mail,
  Newspaper,
  Paperclip,
  Phone,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import LogoImg from '../png/LOGO.png'
import './Auth/Auth.css'
import './Contact.css'

const motion = Motion

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const IDENTITY_OPTIONS = [
  { key: 'consumer', label: '消費者', icon: UserRound },
  { key: 'partner', label: '合作廠商', icon: Handshake },
  { key: 'media', label: '媒體', icon: Newspaper },
  { key: 'other', label: '其他', icon: FileText },
]

const CONTACT_TYPE_OPTIONS = {
  consumer: ['訂單與配送', '退換貨申請', '產品與成分', '會員與點數', '訂閱方案', '付款與發票'],
  partner: ['通路合作', '供應與採購', '品牌聯名', '報價需求', '其他合作提案'],
  media: ['採訪邀約', '品牌新聞', '圖文素材申請', '其他媒體需求'],
  other: ['一般諮詢', '網站建議', '活動合作', '其他事項'],
}

const createReferenceNumber = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  return `CS${year}${month}${day}-${suffix}`
}

const formatFileSize = (size) => {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getInitialForm = (user) => ({
  identity: 'consumer',
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  companyName: '',
  jobTitle: '',
  taxId: '',
  orderNumber: '',
  problemType: '',
  subject: '',
  message: '',
  attachments: [],
  agreePrivacy: false,
})

const Contact = () => {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(getInitialForm(user))
  const [errors, setErrors] = useState({})
  const [isDragActive, setIsDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedReference, setSubmittedReference] = useState('')

  const currentTypeOptions = CONTACT_TYPE_OPTIONS[form.identity] || CONTACT_TYPE_OPTIONS.other
  const showBusinessFields = form.identity === 'partner' || form.identity === 'media'
  const showConsumerOrderField = form.identity === 'consumer'

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
      orderNumber: '',
    }))
  }

  const mergeAttachments = (incomingFiles) => {
    const files = Array.from(incomingFiles || [])
    if (!files.length) return

    const invalidType = files.find((file) => !ALLOWED_ATTACHMENT_TYPES.includes(file.type))
    if (invalidType) {
      setErrors((prev) => ({ ...prev, attachments: '附件僅支援 JPG、PNG 或 PDF 檔案。' }))
      return
    }

    const invalidSize = files.find((file) => file.size > MAX_ATTACHMENT_SIZE)
    if (invalidSize) {
      setErrors((prev) => ({ ...prev, attachments: '單一附件大小不可超過 10MB。' }))
      return
    }

    setForm((prev) => {
      const merged = [...prev.attachments]

      files.forEach((file) => {
        const exists = merged.some(
          (item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified,
        )

        if (!exists) merged.push(file)
      })

      return { ...prev, attachments: merged }
    })
    setErrors((prev) => ({ ...prev, attachments: '' }))
  }

  const handleFileInputChange = (event) => {
    mergeAttachments(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragActive(false)
    mergeAttachments(event.dataTransfer.files)
  }

  const removeAttachment = (index) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, fileIndex) => fileIndex !== index),
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.identity) nextErrors.identity = '請先選擇身份別。'
    if (!form.name.trim()) nextErrors.name = '請輸入姓名。'
    if (!form.email.trim()) nextErrors.email = '請輸入 Email。'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = '請輸入有效的 Email 格式。'

    if (form.phone && !/^09\d{8}$/.test(form.phone.trim())) {
      nextErrors.phone = '手機號碼請輸入 09 開頭的 10 碼格式。'
    }

    if (showBusinessFields && !form.companyName.trim()) nextErrors.companyName = '請輸入公司名稱。'
    if (showBusinessFields && !form.jobTitle.trim()) nextErrors.jobTitle = '請輸入職稱。'
    if (form.taxId && !/^\d{8}$/.test(form.taxId.trim())) nextErrors.taxId = '統一編號請輸入 8 碼數字。'

    if (!form.problemType) nextErrors.problemType = '請選擇問題類型。'
    if (!form.subject.trim()) nextErrors.subject = '請輸入訊息主旨。'
    else if (form.subject.trim().length > 80) nextErrors.subject = '訊息主旨不可超過 80 字。'

    if (!form.message.trim()) nextErrors.message = '請輸入詳細說明。'
    else if (form.message.trim().length > 1000) nextErrors.message = '詳細說明不可超過 1000 字。'

    if (!form.agreePrivacy) nextErrors.agreePrivacy = '請勾選同意隱私政策後再送出。'

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setSubmittedReference(createReferenceNumber())
    setIsSubmitting(false)
  }

  const handleReset = () => {
    setForm(getInitialForm(user))
    setErrors({})
    setIsDragActive(false)
    setIsSubmitting(false)
    setSubmittedReference('')
  }

  return (
    <main className="auth-page contact-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <Link to="/">
            <img
              src={LogoImg}
              alt="Mr. Polar"
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
          <h2>聯絡 Polar<br />讓每次詢問都可追蹤</h2>
          <p>依據您的身份與問題類型自動分流，協助我們更快把需求送到正確窗口。</p>
        </div>

        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Mail size={16} /></div>
            <span>送出後立即建立案件編號，方便追蹤處理進度。</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><Handshake size={16} /></div>
            <span>支援消費者、合作廠商、媒體與其他綜合詢問。</span>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><ShieldCheck size={16} /></div>
            <span>表單資料以 256-bit SSL 加密傳輸，保護您的聯絡資訊。</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div
          className="auth-form-container contact-form-container"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="auth-mobile-logo">
            <Link to="/">
              <img
                src={LogoImg}
                alt="Mr. Polar"
                style={{ height: 'auto', width: 293, maxWidth: '100%', display: 'block' }}
              />
            </Link>
          </div>

          {!submittedReference ? (
            <>
              <div className="auth-header">
                <h1>聯絡我們</h1>
                <p>填寫完整資訊後，我們會依案件性質分派對應團隊，並以 Email 與您聯繫。</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <section className="contact-section">
                  <div className="contact-section-head">
                    <span className="contact-section-step">A</span>
                    <div>
                      <h2>身份</h2>
                      <p>選擇身份後，問題類型與欄位會自動切換。</p>
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
                      <h2>基本資料</h2>
                      <p>請留下可聯繫資訊，方便我們回覆。</p>
                    </div>
                  </div>

                  <div className="auth-row-half">
                    <div className="auth-field">
                      <label htmlFor="contact-name">姓名 *</label>
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
                      <label htmlFor="contact-email">Email *</label>
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
                      <label htmlFor="contact-phone">手機號碼</label>
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

                    {showConsumerOrderField ? (
                      <div className="auth-field">
                        <label htmlFor="contact-order">相關訂單編號</label>
                        <input
                          id="contact-order"
                          type="text"
                          className="apple-input"
                          placeholder="例如 PL2026-0314"
                          value={form.orderNumber}
                          onChange={(event) => setField('orderNumber', event.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="contact-spacer" aria-hidden="true" />
                    )}
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
                            <label htmlFor="contact-company">公司名稱 *</label>
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
                            <label htmlFor="contact-job-title">職稱 *</label>
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
                              placeholder="請輸入 8 碼統編"
                              maxLength={8}
                              value={form.taxId}
                              onChange={(event) => setField('taxId', event.target.value.replace(/\D/g, ''))}
                            />
                            {errors.taxId && <p className="auth-field-error"><AlertCircle size={12} />{errors.taxId}</p>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                <section className="contact-section">
                  <div className="contact-section-head">
                    <span className="contact-section-step">C</span>
                    <div>
                      <h2>問題類型</h2>
                      <p>依據身份別顯示對應分類，幫助快速分流。</p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={form.identity}
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

                  <div className="auth-field" style={{ marginBottom: 0 }}>
                    <div className="contact-counter-row">
                      <label htmlFor="contact-subject">訊息主旨 *</label>
                      <span>{form.subject.length}/80</span>
                    </div>
                    <input
                      id="contact-subject"
                      type="text"
                      className="apple-input"
                      placeholder="請輸入 80 字內的主旨"
                      maxLength={80}
                      value={form.subject}
                      onChange={(event) => setField('subject', event.target.value)}
                    />
                    {errors.subject && <p className="auth-field-error"><AlertCircle size={12} />{errors.subject}</p>}
                  </div>
                </section>

                <section className="contact-section">
                  <div className="contact-section-head">
                    <span className="contact-section-step">D</span>
                    <div>
                      <h2>詳細內容</h2>
                      <p>請盡量提供完整情境、時間點或需求內容。</p>
                    </div>
                  </div>

                  <div className="auth-field">
                    <div className="contact-counter-row">
                      <label htmlFor="contact-message">詳細說明 *</label>
                      <span>{form.message.length}/1000</span>
                    </div>
                    <textarea
                      id="contact-message"
                      className="apple-input contact-textarea"
                      placeholder="請輸入詳細說明，最多 1000 字。"
                      maxLength={1000}
                      value={form.message}
                      onChange={(event) => setField('message', event.target.value)}
                    />
                    {errors.message && <p className="auth-field-error"><AlertCircle size={12} />{errors.message}</p>}
                  </div>

                  <div className="auth-field" style={{ marginBottom: 0 }}>
                    <label>附件</label>
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
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        multiple
                        className="contact-upload-input"
                        onChange={handleFileInputChange}
                      />
                      <div className="contact-upload-icon">
                        <UploadCloud size={22} />
                      </div>
                      <h3>拖曳檔案到這裡，或手動選擇附件</h3>
                      <p>支援 JPG / PNG / PDF，單一檔案上限 10MB。</p>
                      <button
                        type="button"
                        className="contact-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip size={16} />
                        選擇附件
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

                <section className="contact-section">
                  <div className="contact-section-head">
                    <span className="contact-section-step">E</span>
                    <div>
                      <h2>確認</h2>
                      <p>送出前請確認資料正確，並同意隱私政策。</p>
                    </div>
                  </div>

                  <div className="auth-terms contact-privacy">
                    <input
                      type="checkbox"
                      id="contact-agree-privacy"
                      checked={form.agreePrivacy}
                      onChange={(event) => setField('agreePrivacy', event.target.checked)}
                    />
                    <label htmlFor="contact-agree-privacy">
                      我同意依照 <Link to="/faq">隱私政策</Link> 使用本次提交之聯絡資料，作為案件處理與後續回覆用途。
                    </label>
                  </div>
                  {errors.agreePrivacy && <p className="auth-field-error"><AlertCircle size={12} />{errors.agreePrivacy}</p>}
                </section>

                <div className="contact-ssl-note">
                  <ShieldCheck size={18} />
                  <span>您的資料透過 256-bit SSL 加密傳輸，符合台灣消費者常見的信任與安全期待。</span>
                </div>

                <button type="submit" className="btn-blue auth-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <><span className="auth-spinner" />送出中...</> : '送出需求'}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div className="auth-success-box contact-success-box">
                <h3>案件已成功送出</h3>
                <p>我們已收到您的訊息，後續將由對應團隊與您聯繫。</p>
              </div>

              <div className="contact-reference-card">
                <div className="contact-reference-label">參考編號</div>
                <div className="contact-reference-value">{submittedReference}</div>
                <div className="contact-reference-help">建議保留此編號，後續詢問可更快協助您查詢進度。</div>
              </div>

              <div className="contact-success-actions">
                <button type="button" className="btn-blue auth-submit-btn" onClick={handleReset}>
                  再送出一則訊息
                </button>
                <p className="auth-switch">
                  <Link to="/">返回首頁</Link>
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  )
}

export default Contact
