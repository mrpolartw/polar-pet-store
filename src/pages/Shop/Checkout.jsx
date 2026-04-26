import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Truck,
  Store,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Ticket,
  Building2,
  HeartHandshake,
  ShieldCheck,
  UserPlus,
  MessageCircle,
} from 'lucide-react';

import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { useToast } from '../../context/ToastContext'
import {
  validateRequired,
  validateName,
  validatePhone,
  validateEmail,
  validateForm,
} from '../../utils/validators';
import { CONFIG } from '../../constants/config';
import SEOHead from '../../components/common/SEOHead';
import analytics from '../../utils/analytics'
import { useCheckoutForm } from '../../modules/checkout/hooks/useCheckoutForm'
import { usePromoCode }    from '../../modules/checkout/hooks/usePromoCode'
import { useOrderSubmit }  from '../../modules/checkout/hooks/useOrderSubmit'
import { buildCheckoutSummary, validateRedeemablePoints } from '../../modules/checkout/pointRedemption'

void useNavigate;
void validateRequired;
void validateName;
void validatePhone;
void validateEmail;
void validateForm;

const Checkout = () => {
  const {
    user,
    membershipSummary,
    isMembershipLoading,
  } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const {
    cartItems,
    subtotal,
    pointRedemption,
    setPointRedemption,
    clearPointRedemption,
  } = useCart();
  const { form, setField, getPayload } = useCheckoutForm()
  const {
    code: promoCode, setCode: setPromoCode,
    apply: handleApplyPromo, remove: removePromo,
    discount, isApplied: isPromoApplied,
    isLoading: isPromoLoading, error: promoError,
  } = usePromoCode()
  const {
    submit, isSubmitting, submitError, fieldErrors, setFieldErrors, setSubmitError,
  } = useOrderSubmit()
  const [agreed, setAgreed] = useState(false)
  const [requestedPoints, setRequestedPoints] = useState(
    pointRedemption?.requestedPoints ? String(pointRedemption.requestedPoints) : ''
  )
  const [pointRedemptionError, setPointRedemptionError] = useState(null)
  const [isPointPreviewLoading, setIsPointPreviewLoading] = useState(false)
  const initialCheckoutAnalyticsRef = useRef({ cartItems, subtotal })

  useEffect(() => {
    const {
      cartItems: initialCartItems,
      subtotal: initialSubtotal,
    } = initialCheckoutAnalyticsRef.current

    if (initialCartItems.length > 0) {
      analytics.beginCheckout(initialCartItems, initialSubtotal)
    }
  }, [])

  void removePromo;

  // TODO: [BACKEND] 金額最終須由後端計算，前端僅作顯示
  const shippingFee = form.shippingMethod === 'store'
    ? 0 : CONFIG.SHIPPING_FEE
  const localRedemptionPreview = validateRedeemablePoints({
    availablePoints: membershipSummary?.availablePoints ?? 0,
    requestedPoints: requestedPoints === '' ? 0 : Number(requestedPoints),
    orderSubtotal: subtotal,
  })
  const appliedRedemptionAmount = Number(pointRedemption?.redemptionAmount ?? 0)
  const checkoutSummary = buildCheckoutSummary({
    subtotal,
    shippingFee,
    promoDiscount: discount,
    redeemedPoints: appliedRedemptionAmount,
  })
  const total = checkoutSummary.total

  useEffect(() => {
    setRequestedPoints(
      pointRedemption?.requestedPoints ? String(pointRedemption.requestedPoints) : ''
    )
  }, [pointRedemption?.requestedPoints])

  useEffect(() => {
    if (!user) {
      clearPointRedemption()
      setPointRedemptionError(null)
      return undefined
    }

    if (requestedPoints === '') {
      clearPointRedemption()
      setPointRedemptionError(null)
      return undefined
    }

    const normalizedRequestedPoints = Number(requestedPoints)

    if (!Number.isInteger(normalizedRequestedPoints)) {
      setPointRedemption({
        requestedPoints: 0,
        availablePoints: membershipSummary?.availablePoints ?? 0,
        maxRedeemablePoints: 0,
        redeemablePoints: 0,
        redemptionAmount: 0,
        orderSubtotal: subtotal,
        remainingAmount: subtotal,
        isValid: false,
        validationMessage: '折抵點數必須為整數',
      })
      setPointRedemptionError('折抵點數必須為整數')
      return undefined
    }

    const timer = setTimeout(() => {
      setPointRedemption({
        requestedPoints: localRedemptionPreview.requestedPoints,
        availablePoints: localRedemptionPreview.availablePoints,
        maxRedeemablePoints: localRedemptionPreview.maxRedeemablePoints,
        redeemablePoints: localRedemptionPreview.redeemablePoints,
        redemptionAmount: localRedemptionPreview.redemptionAmount,
        orderSubtotal: localRedemptionPreview.orderSubtotal,
        remainingAmount: localRedemptionPreview.remainingAmount,
        isValid: localRedemptionPreview.isValid,
        validationMessage: localRedemptionPreview.validationMessage,
      })
      setPointRedemptionError(localRedemptionPreview.validationMessage ?? null)
    }, 150)

    return () => {
      clearTimeout(timer)
    }
  }, [
    clearPointRedemption,
    localRedemptionPreview.availablePoints,
    localRedemptionPreview.isValid,
    localRedemptionPreview.maxRedeemablePoints,
    localRedemptionPreview.orderSubtotal,
    localRedemptionPreview.redeemablePoints,
    localRedemptionPreview.redemptionAmount,
    localRedemptionPreview.remainingAmount,
    localRedemptionPreview.requestedPoints,
    localRedemptionPreview.validationMessage,
    membershipSummary?.availablePoints,
    requestedPoints,
    setPointRedemption,
    subtotal,
    user,
  ])

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    if (!agreed) {
      setSubmitError('請先閱讀並同意服務條款與隱私政策')
      const el = document.getElementById('agree-terms')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (pointRedemption?.requestedPoints > 0 && !pointRedemption?.isValid) {
      setSubmitError(pointRedemption.validationMessage || '請先修正點數折抵資料')
      return
    }

    const payload = getPayload(
      promoCode,
      isPromoApplied,
      subtotal,
      discount,
      pointRedemption?.redeemablePoints > 0
        ? {
            ...pointRedemption,
            referenceId: pointRedemption.referenceId ?? null,
          }
        : null
    )
    await submit(payload)
  }

  return (
    <div className="checkout-page">
      <SEOHead title="結帳" noIndex={true} />
      <div className="checkout-header-simple">
        <h1 className="headline-pro">安全結帳</h1>
      </div>

      {/* 未登入提示 */}
      {!user && (
        <div style={{
          maxWidth: 860,
          margin: '0 auto 16px',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#003153', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UserPlus size={16} color="#fff" />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                登入 / 註冊會員，購物更划算
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#6e6e73', marginTop: 2 }}>
                消費自動累積點數可折抵，並即時接收出貨、配送狀態通知
              </p>
            </div>
          </div>
          <Link
            to="/login"
            state={{ from: location.pathname }}
            style={{
              padding: '8px 18px',
              background: '#003153',
              color: '#fff',
              borderRadius: 980,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            登入 / 註冊
          </Link>
        </div>
      )}

      {/* 已登入但未串接 LINE 提示 */}
      {user && !user.lineLinked && (
        <div style={{
          maxWidth: 860,
          margin: '0 auto 16px',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#06C755', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <MessageCircle size={16} color="#fff" />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
                加入 LINE 官方帳號，訂單資訊即時掌握
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#6e6e73', marginTop: 2 }}>
                付款成功、出貨通知、物流動態，第一時間透過 LINE 推播給您
              </p>
            </div>
          </div>
          <a
            href="https://lin.ee/THZqvZ5r"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 18px',
              background: '#06C755',
              color: '#fff',
              borderRadius: 980,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            加入 LINE
          </a>
        </div>
      )}

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <h2 className="section-title">1. 選擇運送方式</h2>
            <div className="option-grid">
              <div
                className={`option-card ${form.shippingMethod === 'store' ? 'active' : ''}`}
                onClick={() => {
                  setField('shippingMethod', 'store')
                  analytics.addShippingInfo('store')
                }}
              >
                <Store size={32} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">超商取貨</h3>
                <p className="option-desc">7-ELEVEN 交貨便</p>
                {form.shippingMethod === 'store' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${form.shippingMethod === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setField('shippingMethod', 'home')
                  analytics.addShippingInfo('home')
                }}
              >
                <Truck size={32} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">黑貓宅配</h3>
                <p className="option-desc">常溫配送到府</p>
                {form.shippingMethod === 'home' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="section-title">2. 填寫聯絡與配送資訊</h2>

            <div className="form-group">
              <h3 className="form-subtitle">購買人資訊</h3>
              <div className="form-row">
                <input
                  id={form.sameAsBuyer ? 'recipientName' : undefined}
                  type="text"
                  className="apple-input"
                  placeholder="購買人真實姓名"
                  value={form.buyerName}
                  onChange={(e) => {
                    setField('buyerName', e.target.value);
                    if (form.sameAsBuyer) {
                      setFieldErrors((prev) => ({ ...prev, recipientName: '' }));
                    }
                  }}
                />
                {form.sameAsBuyer && fieldErrors.recipientName && (
                  <p style={{ fontSize: 12, color: '#e74c3c', marginTop: 4 }}>
                    {fieldErrors.recipientName}
                  </p>
                )}
              </div>
              <div className="form-row half-half">
                <div>
                  <input
                    id="recipientEmail"
                    type="email"
                    className="apple-input"
                    placeholder="電子郵件地址"
                    value={form.buyerEmail}
                    onChange={(e) => {
                      setField('buyerEmail', e.target.value);
                      setFieldErrors((prev) => ({ ...prev, recipientEmail: '' }));
                    }}
                  />
                  {fieldErrors.recipientEmail && (
                    <p style={{ fontSize: 12, color: '#e74c3c', marginTop: 4 }}>
                      {fieldErrors.recipientEmail}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    id={form.sameAsBuyer ? 'recipientPhone' : undefined}
                    type="tel"
                    className="apple-input"
                    placeholder="手機號碼（例：0912345678）"
                    maxLength={10}
                    value={form.buyerPhone}
                    onChange={(e) => {
                      setField('buyerPhone', e.target.value.replace(/\D/g, ''));
                      if (form.sameAsBuyer) {
                        setFieldErrors((prev) => ({ ...prev, recipientPhone: '' }));
                      }
                    }}
                  />
                  {form.sameAsBuyer && fieldErrors.recipientPhone && (
                    <p style={{ fontSize: 12, color: '#e74c3c', marginTop: 4 }}>
                      {fieldErrors.recipientPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="sameAsBuyer"
                checked={form.sameAsBuyer}
                onChange={(e) => setField('sameAsBuyer', e.target.checked)}
              />
              <label htmlFor="sameAsBuyer">收件人資料與購買人相同</label>
            </div>

            {!form.sameAsBuyer && (
              <div className="form-group slide-down">
                <h3 className="form-subtitle">收件人資訊</h3>
                <div className="form-row half-half">
                  <div>
                    <input
                      id="recipientName"
                      type="text"
                      className="apple-input"
                      placeholder="收件人真實姓名"
                      value={form.recipientName}
                      onChange={(e) => {
                        setField('recipientName', e.target.value);
                        setFieldErrors((prev) => ({ ...prev, recipientName: '' }));
                      }}
                    />
                    {fieldErrors.recipientName && (
                      <p style={{ fontSize: 12, color: '#e74c3c', marginTop: 4 }}>
                        {fieldErrors.recipientName}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      id="recipientPhone"
                      type="tel"
                      className="apple-input"
                      placeholder="收件人手機號碼"
                      maxLength={10}
                      value={form.recipientPhone}
                      onChange={(e) => {
                        setField('recipientPhone', e.target.value.replace(/\D/g, ''));
                        setFieldErrors((prev) => ({ ...prev, recipientPhone: '' }));
                      }}
                    />
                    {fieldErrors.recipientPhone && (
                      <p style={{ fontSize: 12, color: '#e74c3c', marginTop: 4 }}>
                        {fieldErrors.recipientPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '24px' }}>
              <h3 className="form-subtitle">配送細節</h3>
              {form.shippingMethod === 'store' ? (
                <div className="store-select-box">
                  <p>請選擇您要取件的 7-ELEVEN 門市，貨件送達將以簡訊通知。</p>
                  <button className="btn-blue btn-select-store">開啟電子地圖選擇門市</button>
                </div>
              ) : (
                <div className="slide-down">
                  <div className="form-row half-half">
                    <select className="apple-input select-input">
                      <option value="">選擇縣市</option>
                      <option value="taipei">台北市</option>
                      <option value="newtaipei">新北市</option>
                    </select>
                    <select className="apple-input select-input">
                      <option value="">選擇鄉鎮市區</option>
                      <option value="daan">大安區</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <input type="text" className="apple-input" placeholder="完整街道與門牌號碼" />
                  </div>
                  <div className="form-row">
                    <select className="apple-input select-input">
                      <option value="any">配送時段：不限</option>
                      <option value="morning">配送時段：13:00 前</option>
                      <option value="afternoon">配送時段：14:00 - 18:00</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="section-title">3. 選擇付款方式</h2>
            <div className="option-grid payment-grid">
              <div
                className={`option-card ${form.paymentMethod === 'credit' ? 'active' : ''}`}
                onClick={() => {
                  setField('paymentMethod', 'credit')
                  analytics.addPaymentInfo('credit')
                }}
              >
                <CreditCard size={28} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">信用卡</h3>
                <p className="option-desc">免跳轉 安全支付</p>
                {form.paymentMethod === 'credit' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${form.paymentMethod === 'linepay' ? 'active' : ''}`}
                onClick={() => {
                  setField('paymentMethod', 'linepay')
                  analytics.addPaymentInfo('linepay')
                }}
              >
                <Smartphone size={28} strokeWidth={1.5} className="option-icon line-color" />
                <h3 className="option-title">LINE Pay</h3>
                <p className="option-desc">快速授權</p>
                {form.paymentMethod === 'linepay' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${form.paymentMethod === 'applepay' ? 'active' : ''}`}
                onClick={() => {
                  setField('paymentMethod', 'applepay')
                  analytics.addPaymentInfo('applepay')
                }}
              >
                <Smartphone size={28} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">Apple Pay</h3>
                <p className="option-desc">快速驗證付款</p>
                {form.paymentMethod === 'applepay' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${form.paymentMethod === 'transfer' ? 'active' : ''}`}
                onClick={() => {
                  setField('paymentMethod', 'transfer')
                  analytics.addPaymentInfo('transfer')
                }}
              >
                <Store size={28} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">ATM 虛擬帳號</h3>
                <p className="option-desc">轉帳付款</p>
                {form.paymentMethod === 'transfer' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
            </div>

            {form.paymentMethod === 'credit' && import.meta.env.DEV && (
              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 8,
                  padding: '8px 14px',
                  marginBottom: 12,
                  fontSize: 12,
                  color: '#9a3412',
                }}
              >
                ⚠️ 開發模式：信用卡欄位為 UI 佔位，上線前須替換為金流商 Hosted Fields
              </div>
            )}

            {form.paymentMethod === 'credit' && (
              <div className="seamless-payment-box slide-down">
                <div className="seamless-header">
                  <ShieldCheck size={18} color="#003153" />
                  <span>PayUni 統一金流 256-bit 銀行級加密連線</span>
                </div>
                <div className="form-row">
                  <input type="text" className="apple-input" placeholder="信用卡卡號" maxLength={19} />
                </div>
                <div className="form-row half-half">
                  <input type="text" className="apple-input" placeholder="有效期限 (MM/YY)" maxLength={5} />
                  <input type="text" className="apple-input" placeholder="安全碼 (CVC/CVV)" maxLength={3} />
                </div>
                <div className="installment-options">
                  <h4 className="mini-title">分期期數</h4>
                  <div className="form-row half-half">
                    <label className="radio-card">
                      <input type="radio" name="installment" defaultChecked />
                      <span>一次付清</span>
                    </label>
                    <label className="radio-card">
                      <input type="radio" name="installment" />
                      <span>分 3 期 0 利率</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="checkout-section">
            <h2 className="section-title">4. 電子發票與備註</h2>

            <div className="form-group">
              <h3 className="form-subtitle">發票開立方式</h3>
              <div className="form-row">
                <select
                  className="apple-input select-input"
                  value={form.invoiceType}
                  onChange={(e) => setField('invoiceType', e.target.value)}
                >
                  <option value="member">會員載具</option>
                  <option value="mobile">手機條碼載具</option>
                  <option value="company">公司戶發票</option>
                  <option value="donate">愛心捐贈發票</option>
                </select>
              </div>

              {form.invoiceType === 'mobile' && (
                <div className="form-row slide-down">
                  <div className="input-with-icon">
                    <Smartphone className="input-icon" size={20} />
                    <input
                      type="text"
                      className="apple-input with-icon"
                      placeholder="請輸入手機條碼（格式：/ABC1234）"
                      value={form.invoiceMobile}
                      onChange={(e) => setField('invoiceMobile', e.target.value)}
                      maxLength={8}
                    />
                  </div>
                </div>
              )}

              {form.invoiceType === 'company' && (
                <div className="form-row half-half slide-down">
                  <div className="input-with-icon">
                    <Building2 className="input-icon" size={20} />
                    <input
                      type="text"
                      className="apple-input with-icon"
                      placeholder="統一編號（8 碼數字）"
                      value={form.invoiceTaxId}
                      onChange={(e) => setField('invoiceTaxId', e.target.value)}
                      maxLength={8}
                    />
                  </div>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="公司抬頭"
                    value={form.invoiceCompany}
                    onChange={(e) => setField('invoiceCompany', e.target.value)}
                  />
                </div>
              )}

              {form.invoiceType === 'donate' && (
                <div className="form-row slide-down">
                  <div className="input-with-icon">
                    <HeartHandshake className="input-icon" size={20} />
                    <input
                      type="text"
                      className="apple-input with-icon"
                      placeholder="請輸入機構捐贈碼"
                      value={form.invoiceDonateCode}
                      onChange={(e) => setField('invoiceDonateCode', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <h3 className="form-subtitle">訂單備註（選填）</h3>
              <textarea className="apple-input textarea-input" placeholder="有任何備註需求請填寫於此" />
            </div>
          </section>
        </div>

        <div className="checkout-sidebar">
          <div className="summary-sticky-card">
            <h2 className="summary-title">訂單摘要</h2>

            <div className="summary-items-preview">
              {cartItems.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-gray-dark)', textAlign: 'center' }}>
                  購物車是空的
                </p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="preview-item">
                    <img src={item.image} alt={item.name} />
                    <div className="preview-info">
                      <h4>{item.name}</h4>
                      <p>{item.specs}</p>
                    </div>
                    <span>NT${item.price?.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="promo-code-box">
              <div className="promo-input-group">
                <Ticket size={20} className="promo-icon" />
                <input
                  type="text"
                  placeholder="輸入優惠代碼"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={isPromoApplied || isPromoLoading}
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={isPromoApplied || isPromoLoading || !promoCode.trim()}
                >
                  {isPromoLoading ? '驗證中...' : isPromoApplied ? '已套用' : '套用'}
                </button>
              </div>
              {promoError && (
                <p style={{ fontSize: 12, color: '#e74c3c', marginTop: 6 }}>
                  {promoError}
                </p>
              )}
            </div>

            <div
              className="promo-code-box"
              style={{
                marginTop: 12,
                padding: 18,
                borderRadius: 18,
                border: '1px solid var(--color-gray-light)',
                background: 'rgba(243, 239, 230, 0.55)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1d1d1f' }}>
                    點數折抵
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6e6e73' }}>
                    1 點可折抵 1 元，送出訂單前會再由後端驗證一次。
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#6e6e73' }}>可用點數</div>
                  <strong style={{ fontSize: 18, color: '#003153' }}>
                    {isMembershipLoading
                      ? '讀取中...'
                      : `${Number(membershipSummary?.availablePoints ?? 0).toLocaleString()} 點`}
                  </strong>
                </div>
              </div>

              {!user ? (
                <p style={{ margin: 0, fontSize: 13, color: '#6e6e73', lineHeight: 1.6 }}>
                  登入會員後即可於結帳時使用點數折抵。
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="apple-input"
                      placeholder="輸入欲折抵點數"
                      value={requestedPoints}
                      onChange={(event) => {
                        const nextValue = event.target.value

                        if (!/^\d*$/.test(nextValue)) {
                          return
                        }

                        setRequestedPoints(nextValue)
                        if (!nextValue) {
                          clearPointRedemption()
                          setPointRedemptionError(null)
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const maxPoints = Math.min(
                          Number(membershipSummary?.availablePoints ?? 0),
                          subtotal
                        )

                        setRequestedPoints(String(Math.max(0, Math.floor(maxPoints))))
                        toast.info('已帶入本次可折抵上限')
                      }}
                      disabled={Number(membershipSummary?.availablePoints ?? 0) <= 0 || subtotal <= 0}
                      style={{
                        border: '1px solid #003153',
                        background: 'transparent',
                        color: '#003153',
                        borderRadius: 999,
                        padding: '10px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      全額可折抵
                    </button>
                  </div>

                  <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
                    <div className="calc-row">
                      <span>本次可折抵上限</span>
                      <span>
                        {Number(
                          pointRedemption?.maxRedeemablePoints ??
                            localRedemptionPreview.maxRedeemablePoints
                        ).toLocaleString()} 點
                      </span>
                    </div>
                    <div className="calc-row">
                      <span>本次折抵金額</span>
                      <span>
                        -NT$
                        {Number(
                          pointRedemption?.redemptionAmount ??
                            localRedemptionPreview.redemptionAmount
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {(pointRedemptionError || pointRedemption?.validationMessage) && (
                    <p style={{ fontSize: 12, color: '#b42318', marginTop: 10, marginBottom: 0 }}>
                      {pointRedemptionError || pointRedemption?.validationMessage}
                    </p>
                  )}

                  {!pointRedemptionError && requestedPoints !== '' && (
                    <p style={{ fontSize: 12, color: '#6e6e73', marginTop: 10, marginBottom: 0 }}>
                      {isPointPreviewLoading
                        ? '正在驗證折抵點數...'
                        : `折抵後商品應付金額為 NT$${Number(
                            pointRedemption?.remainingAmount ??
                              localRedemptionPreview.remainingAmount
                          ).toLocaleString()}`}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="summary-calc">
              <div className="calc-row">
                <span>小計</span>
                <span>NT${subtotal.toLocaleString()}</span>
              </div>
              <div className="calc-row">
                <span>運費</span>
                <span>{shippingFee === 0 ? '免費' : `NT$${shippingFee}`}</span>
              </div>
              {isPromoApplied && (
                <div className="calc-row discount">
                  <span>優惠折扣 ({promoCode})</span>
                  <span>-NT${discount.toLocaleString()}</span>
                </div>
              )}
              {appliedRedemptionAmount > 0 && (
                <div className="calc-row discount">
                  <span>點數折抵</span>
                  <span>-NT${appliedRedemptionAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="calc-row total">
                <span>總計</span>
                <span>NT${total.toLocaleString()}</span>
              </div>
            </div>

            <div className="checkout-agreements">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="agree-terms">
                我已確認訂單無誤，並同意
                <Link to={ROUTES.TERMS}>服務條款</Link>
                {' '}與{' '}
                <Link to={ROUTES.PRIVACY}>隱私政策</Link>
              </label>
            </div>

            {submitError && (
              <p
                style={{
                  fontSize: 13,
                  color: '#e74c3c',
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 8,
                }}
              >
                {submitError}
              </p>
            )}

            <button
              className="btn-blue btn-submit-order"
              onClick={handleSubmitOrder}
              disabled={isSubmitting || cartItems.length === 0}
              style={{ opacity: (isSubmitting || cartItems.length === 0) ? 0.6 : 1 }}
            >
              {isSubmitting ? '處理中...' : '送出訂單'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
