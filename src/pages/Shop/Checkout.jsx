import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck, Store, CreditCard, Smartphone, CheckCircle2,
  Ticket, Building2, HeartHandshake, ShieldCheck
} from 'lucide-react'
import { useCart } from '../../context/CartContext'

const Checkout = () => {
  const navigate = useNavigate()
  const { cartItems, subtotal, clearCart } = useCart()

  // ── 1. 配送方式 ──
  const [shippingMethod, setShippingMethod] = useState('store') // 'store' | 'home'

  // ── 2. 購買人資訊 ──
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [sameAsBuyer, setSameAsBuyer] = useState(true)

  // ── 3. 收件人資訊（若與購買人不同）──
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  // ── 4. 宅配地址 ──
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [timePreference, setTimePreference] = useState('any')

  // ── 5. 付款方式 ──
  const [paymentMethod, setPaymentMethod] = useState('credit') // 'credit' | 'linepay' | 'applepay' | 'transfer'
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  // ── 6. 發票 ──
  const [invoiceType, setInvoiceType] = useState('member') // 'member' | 'mobile' | 'company' | 'donate'
  const [invoiceMobile, setInvoiceMobile] = useState('')
  const [invoiceTaxId, setInvoiceTaxId] = useState('')
  const [invoiceCompany, setInvoiceCompany] = useState('')
  const [invoiceDonateCode, setInvoiceDonateCode] = useState('')

  // ── 7. 折扣碼 ──
  const [promoCode, setPromoCode] = useState('')
  const [isPromoApplied, setIsPromoApplied] = useState(false)

  // ── 8. 同意條款 ──
  const [isAgreed, setIsAgreed] = useState(false)

  // ── 9. 表單錯誤 ──
  const [errors, setErrors] = useState({})

  // ── 金額計算 ──
  const shippingFee = shippingMethod === 'store' ? 0 : 100
  const discount = isPromoApplied ? 200 : 0
  const total = subtotal + shippingFee - discount

  const formatPrice = (price) => `NT$${price.toLocaleString()}`

  // ── 折扣碼驗證 ──
  const handleApplyPromo = (e) => {
    e.preventDefault()
    if (promoCode === 'POLAR2026') {
      setIsPromoApplied(true)
    } else {
      alert('折扣碼無效，請確認後再試')
    }
  }

  // ── 前端表單驗證 ──
  const validate = () => {
    const newErrors = {}

    if (!buyerName.trim()) newErrors.buyerName = '請填寫姓名'
    if (!buyerEmail.trim()) newErrors.buyerEmail = '請填寫電子郵件'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail))
      newErrors.buyerEmail = '電子郵件格式不正確'
    if (!buyerPhone.trim()) newErrors.buyerPhone = '請填寫手機號碼'
    else if (!/^09\d{8}$/.test(buyerPhone))
      newErrors.buyerPhone = '手機號碼格式不正確（09 開頭共 10 碼）'

    if (!sameAsBuyer) {
      if (!recipientName.trim()) newErrors.recipientName = '請填寫收件人姓名'
      if (!recipientPhone.trim()) newErrors.recipientPhone = '請填寫收件人手機號碼'
      else if (!/^09\d{8}$/.test(recipientPhone))
        newErrors.recipientPhone = '手機號碼格式不正確'
    }

    if (shippingMethod === 'home') {
      if (!city) newErrors.city = '請選擇縣市'
      if (!district) newErrors.district = '請選擇鄉鎮市區'
      if (!address.trim()) newErrors.address = '請填寫詳細地址'
    }

    if (paymentMethod === 'credit') {
      const rawCard = cardNumber.replace(/\s/g, '')
      if (!rawCard || rawCard.length < 16) newErrors.cardNumber = '請填寫完整 16 位卡號'
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry))
        newErrors.cardExpiry = '請填寫有效日期（MM/YY）'
      if (!cardCvv || cardCvv.length < 3) newErrors.cardCvv = '請填寫 CVV'
    }

    if (invoiceType === 'mobile') {
      if (!invoiceMobile || !/^\/[0-9A-Z+]{7}$/.test(invoiceMobile))
        newErrors.invoiceMobile = '手機載具格式不正確（格式：/XXXXXXX）'
    }
    if (invoiceType === 'company') {
      if (!invoiceTaxId || invoiceTaxId.length !== 8)
        newErrors.invoiceTaxId = '統一編號需為 8 碼數字'
      if (!invoiceCompany.trim()) newErrors.invoiceCompany = '請填寫公司抬頭'
    }
    if (invoiceType === 'donate' && !invoiceDonateCode.trim())
      newErrors.invoiceDonateCode = '請填寫捐贈碼'

    if (!isAgreed) newErrors.isAgreed = '請勾選同意服務條款後再送出'

    return newErrors
  }

  // ── 送出訂單 ──
  const handleSubmitOrder = (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      // 捲動到第一個錯誤欄位
      const firstError = document.querySelector('.field-error')
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // 驗證通過 → 未來在此呼叫後端 API
    const orderPayload = {
      buyer: { name: buyerName, email: buyerEmail, phone: buyerPhone },
      recipient: sameAsBuyer
        ? { name: buyerName, phone: buyerPhone }
        : { name: recipientName, phone: recipientPhone },
      shippingMethod,
      address: shippingMethod === 'home' ? { city, district, address, timePreference } : null,
      paymentMethod,
      invoiceType,
      promoCode: isPromoApplied ? promoCode : null,
      items: cartItems,
      subtotal,
      shippingFee,
      discount,
      total,
    }
    console.log('準備送出訂單（待串接 API）：', orderPayload)

    // 清空購物車並導向完成頁（目前先導回首頁）
    clearCart()
    alert('訂單成立！感謝您的購買 🐾')
    navigate('/')
  }

  // ── 錯誤欄位 helper ──
  const ErrorMsg = ({ field }) =>
    errors[field] ? <p className="field-error" style={{ color: '#e74c3c', fontSize: 13, marginTop: 4 }}>{errors[field]}</p> : null

  return (
    <div className="checkout-page">
      <div className="checkout-header-simple">
        <h1 className="headline-pro">結帳</h1>
      </div>

      <div className="checkout-layout">
        {/* ══════════ 左側主表單 ══════════ */}
        <div className="checkout-main">

          {/* 1. 配送方式 */}
          <section className="checkout-section">
            <h2 className="section-title">1. 選擇配送方式</h2>
            <div className="option-grid">
              <div
                className={`option-card ${shippingMethod === 'store' ? 'active' : ''}`}
                onClick={() => setShippingMethod('store')}
              >
                <Store size={32} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">超商取貨</h3>
                <p className="option-desc">7-ELEVEN / 全家</p>
                {shippingMethod === 'store' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${shippingMethod === 'home' ? 'active' : ''}`}
                onClick={() => setShippingMethod('home')}
              >
                <Truck size={32} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">宅配到府</h3>
                <p className="option-desc">全台灣本島配送</p>
                {shippingMethod === 'home' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
            </div>
          </section>

          {/* 2. 聯絡資訊 */}
          <section className="checkout-section">
            <h2 className="section-title">2. 聯絡資訊</h2>

            <div className="form-group">
              <h3 className="form-subtitle">購買人資訊</h3>
              <div className="form-row">
                <input
                  type="text"
                  className="apple-input"
                  placeholder="姓名"
                  value={buyerName}
                  onChange={e => { setBuyerName(e.target.value); setErrors(p => ({ ...p, buyerName: '' })) }}
                />
                <ErrorMsg field="buyerName" />
              </div>
              <div className="form-row half-half">
                <div>
                  <input
                    type="email"
                    className="apple-input"
                    placeholder="電子郵件"
                    value={buyerEmail}
                    onChange={e => { setBuyerEmail(e.target.value); setErrors(p => ({ ...p, buyerEmail: '' })) }}
                  />
                  <ErrorMsg field="buyerEmail" />
                </div>
                <div>
                  <input
                    type="tel"
                    className="apple-input"
                    placeholder="手機號碼（0912345678）"
                    maxLength={10}
                    value={buyerPhone}
                    onChange={e => { setBuyerPhone(e.target.value); setErrors(p => ({ ...p, buyerPhone: '' })) }}
                  />
                  <ErrorMsg field="buyerPhone" />
                </div>
              </div>
            </div>

            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="sameAsBuyer"
                checked={sameAsBuyer}
                onChange={e => setSameAsBuyer(e.target.checked)}
              />
              <label htmlFor="sameAsBuyer">收件人與購買人相同</label>
            </div>

            {!sameAsBuyer && (
              <div className="form-group slide-down">
                <h3 className="form-subtitle">收件人資訊</h3>
                <div className="form-row half-half">
                  <div>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="收件人姓名"
                      value={recipientName}
                      onChange={e => { setRecipientName(e.target.value); setErrors(p => ({ ...p, recipientName: '' })) }}
                    />
                    <ErrorMsg field="recipientName" />
                  </div>
                  <div>
                    <input
                      type="tel"
                      className="apple-input"
                      placeholder="收件人手機"
                      maxLength={10}
                      value={recipientPhone}
                      onChange={e => { setRecipientPhone(e.target.value); setErrors(p => ({ ...p, recipientPhone: '' })) }}
                    />
                    <ErrorMsg field="recipientPhone" />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: 24 }}>
              <h3 className="form-subtitle">配送地址</h3>
              {shippingMethod === 'store' ? (
                <div className="store-select-box">
                  <p>已選擇：7-ELEVEN 台中文心門市</p>
                  <button className="btn-blue btn-select-store">重新選擇門市</button>
                </div>
              ) : (
                <div className="slide-down">
                  <div className="form-row half-half">
                    <div>
                      <select
                        className="apple-input select-input"
                        value={city}
                        onChange={e => { setCity(e.target.value); setErrors(p => ({ ...p, city: '' })) }}
                      >
                        <option value="">選擇縣市</option>
                        <option value="taipei">台北市</option>
                        <option value="newtaipei">新北市</option>
                        <option value="taichung">台中市</option>
                        <option value="kaohsiung">高雄市</option>
                      </select>
                      <ErrorMsg field="city" />
                    </div>
                    <div>
                      <select
                        className="apple-input select-input"
                        value={district}
                        onChange={e => { setDistrict(e.target.value); setErrors(p => ({ ...p, district: '' })) }}
                      >
                        <option value="">選擇鄉鎮市區</option>
                        <option value="daan">大安區</option>
                        <option value="xitun">西屯區</option>
                        <option value="zhonghe">中和區</option>
                      </select>
                      <ErrorMsg field="district" />
                    </div>
                  </div>
                  <div className="form-row">
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="詳細地址"
                      value={address}
                      onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })) }}
                    />
                    <ErrorMsg field="address" />
                  </div>
                  <div className="form-row">
                    <select
                      className="apple-input select-input"
                      value={timePreference}
                      onChange={e => setTimePreference(e.target.value)}
                    >
                      <option value="any">不指定時段</option>
                      <option value="morning">上午（13:00 前）</option>
                      <option value="afternoon">下午（14:00 - 18:00）</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. 付款方式（PayUni） */}
          <section className="checkout-section">
            <h2 className="section-title">3. 付款方式</h2>
            <div className="option-grid payment-grid">
              {[
                { key: 'credit', icon: <CreditCard size={28} strokeWidth={1.5} className="option-icon" />, label: '信用卡', desc: '支援分期付款' },
                { key: 'linepay', icon: <Smartphone size={28} strokeWidth={1.5} className="option-icon line-color" />, label: 'LINE Pay', desc: '快速行動支付' },
                { key: 'applepay', icon: <Smartphone size={28} strokeWidth={1.5} className="option-icon" />, label: 'Apple Pay', desc: 'Face ID 驗證' },
                { key: 'transfer', icon: <Store size={28} strokeWidth={1.5} className="option-icon" />, label: 'ATM 轉帳', desc: '銀行匯款' },
              ].map(({ key, icon, label, desc }) => (
                <div
                  key={key}
                  className={`option-card ${paymentMethod === key ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(key)}
                >
                  {icon}
                  <h3 className="option-title">{label}</h3>
                  <p className="option-desc">{desc}</p>
                  {paymentMethod === key && <CheckCircle2 className="check-icon" size={20} />}
                </div>
              ))}
            </div>

            {paymentMethod === 'credit' && (
              <div className="seamless-payment-box slide-down">
                <div className="seamless-header">
                  <ShieldCheck size={18} color="#003153" />
                  <span>PayUni 256-bit 安全加密</span>
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="卡號（16 位數字）"
                    maxLength={19}
                    value={cardNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
                      setCardNumber(val)
                      setErrors(p => ({ ...p, cardNumber: '' }))
                    }}
                  />
                  <ErrorMsg field="cardNumber" />
                </div>
                <div className="form-row half-half">
                  <div>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="有效日期 MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '')
                        if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2, 4)
                        setCardExpiry(val)
                        setErrors(p => ({ ...p, cardExpiry: '' }))
                      }}
                    />
                    <ErrorMsg field="cardExpiry" />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="CVC / CVV"
                      maxLength={3}
                      value={cardCvv}
                      onChange={e => { setCardCvv(e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, cardCvv: '' })) }}
                    />
                    <ErrorMsg field="cardCvv" />
                  </div>
                </div>
                <div className="installment-options">
                  <h4 className="mini-title">分期期數</h4>
                  <div className="form-row half-half">
                    <label className="radio-card">
                      <input type="radio" name="installment" defaultChecked />
                      <span>不分期</span>
                    </label>
                    <label className="radio-card">
                      <input type="radio" name="installment" />
                      <span>3 期 0 利率</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 4. 電子發票 */}
          <section className="checkout-section">
            <h2 className="section-title">4. 電子發票</h2>
            <div className="form-group">
              <h3 className="form-subtitle">發票類型</h3>
              <div className="form-row">
                <select
                  className="apple-input select-input"
                  value={invoiceType}
                  onChange={e => setInvoiceType(e.target.value)}
                >
                  <option value="member">會員載具（自動歸戶）</option>
                  <option value="mobile">手機條碼載具</option>
                  <option value="company">公司統編</option>
                  <option value="donate">捐贈發票</option>
                </select>
              </div>

              {invoiceType === 'mobile' && (
                <div className="form-row slide-down">
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="手機條碼（格式：/XXXXXXX）"
                    maxLength={8}
                    value={invoiceMobile}
                    onChange={e => { setInvoiceMobile(e.target.value.toUpperCase()); setErrors(p => ({ ...p, invoiceMobile: '' })) }}
                  />
                  <ErrorMsg field="invoiceMobile" />
                </div>
              )}

              {invoiceType === 'company' && (
                <div className="form-row half-half slide-down">
                  <div>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="統一編號（8 碼）"
                      maxLength={8}
                      value={invoiceTaxId}
                      onChange={e => { setInvoiceTaxId(e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, invoiceTaxId: '' })) }}
                    />
                    <ErrorMsg field="invoiceTaxId" />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="apple-input"
                      placeholder="公司抬頭"
                      value={invoiceCompany}
                      onChange={e => { setInvoiceCompany(e.target.value); setErrors(p => ({ ...p, invoiceCompany: '' })) }}
                    />
                    <ErrorMsg field="invoiceCompany" />
                  </div>
                </div>
              )}

              {invoiceType === 'donate' && (
                <div className="form-row slide-down">
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="捐贈碼"
                    value={invoiceDonateCode}
                    onChange={e => { setInvoiceDonateCode(e.target.value); setErrors(p => ({ ...p, invoiceDonateCode: '' })) }}
                  />
                  <ErrorMsg field="invoiceDonateCode" />
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <h3 className="form-subtitle">備註</h3>
              <textarea className="apple-input textarea-input" placeholder="如有特殊需求請填寫..." />
            </div>
          </section>
        </div>

        {/* ══════════ 右側 Sticky 摘要 ══════════ */}
        <div className="checkout-sidebar">
          <div className="summary-sticky-card">
            <h2 className="summary-title">訂單摘要</h2>

            {/* 動態顯示購物車商品 */}
            <div className="summary-items-preview">
              {cartItems.map(item => (
                <div className="preview-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="preview-info">
                    <h4>{item.name}</h4>
                    <p>數量：{item.quantity}</p>
                  </div>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* 折扣碼 */}
            <div className="promo-code-box">
              <div className="promo-input-group">
                <Ticket size={20} className="promo-icon" />
                <input
                  type="text"
                  placeholder="輸入折扣碼"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  disabled={isPromoApplied}
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={isPromoApplied || !promoCode}
                >
                  {isPromoApplied ? '已套用 ✓' : '套用'}
                </button>
              </div>
            </div>

            {/* 金額明細 */}
            <div className="summary-calc">
              <div className="calc-row">
                <span>商品小計</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="calc-row">
                <span>運費</span>
                <span>{shippingFee === 0 ? '免運費' : formatPrice(shippingFee)}</span>
              </div>
              {isPromoApplied && (
                <div className="calc-row discount">
                  <span>折扣（POLAR2026）</span>
                  <span>-NT$200</span>
                </div>
              )}
              <div className="calc-row total">
                <span>總計</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* 同意條款 */}
            <div className="checkout-agreements">
              <input
                type="checkbox"
                id="agree"
                checked={isAgreed}
                onChange={e => { setIsAgreed(e.target.checked); setErrors(p => ({ ...p, isAgreed: '' })) }}
              />
              <label htmlFor="agree">
                我已閱讀並同意 <a href="/faq">服務條款</a> 及 <a href="/faq">隱私政策</a>
              </label>
            </div>
            {errors.isAgreed && (
              <p className="field-error" style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>
                {errors.isAgreed}
              </p>
            )}

            <button
              className="btn-blue btn-submit-order"
              onClick={handleSubmitOrder}
            >
              確認下單
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
