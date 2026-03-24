import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

import { ROUTES } from '../../constants/routes';
import { useCart } from '../../context/useCart';
import orderService from '../../services/orderService';
import {
  validateRequired,
  validateName,
  validatePhone,
  validateEmail,
  validateForm,
} from '../../utils/validators';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, clearCart } = useCart();

  const [shippingMethod, setShippingMethod] = useState('store');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [sameAsBuyer, setSameAsBuyer] = useState(true);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [invoiceType, setInvoiceType] = useState('member');
  const [invoiceMobile, setInvoiceMobile] = useState('');
  const [invoiceTaxId, setInvoiceTaxId] = useState('');
  const [invoiceCompany, setInvoiceCompany] = useState('');
  const [invoiceDonateCode, setInvoiceDonateCode] = useState('');

  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState(null);
  const [discount, setDiscount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // TODO: [BACKEND] 金額最終須由後端計算，前端僅作顯示
  const shippingFee = shippingMethod === 'store' ? 0 : 100;
  const total = subtotal + shippingFee - discount;

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setIsPromoLoading(true);
    setPromoError(null);

    try {
      // TODO: [BACKEND] orderService.validatePromoCode 需後端實作
      // 後端實作後回傳 { valid: true, discountAmount: 200 }
      const data = await orderService.validatePromoCode(promoCode);

      if (!data || data.valid === false) {
        throw new Error('優惠碼驗證需後端支援，目前無法使用');
      }

      setDiscount(data?.discountAmount ?? 0);
      setIsPromoApplied(true);
    } catch (err) {
      setPromoError(err?.message || '優惠碼驗證需後端支援，目前無法使用');
      setIsPromoApplied(false);
      setDiscount(0);
    } finally {
      setIsPromoLoading(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    if (cartItems.length === 0) {
      setSubmitError('購物車是空的，請先加入商品');
      setIsSubmitting(false);
      return;
    }

    const currentRecipientName = sameAsBuyer ? buyerName : recipientName;
    const currentRecipientPhone = sameAsBuyer ? buyerPhone : recipientPhone;
    const currentRecipientEmail = buyerEmail;

    // 收件人資料前端基本驗證（後端仍需獨立驗證）
    const { isValid, errors } = validateForm([
      { field: 'recipientName', value: currentRecipientName, validator: validateName },
      { field: 'recipientPhone', value: currentRecipientPhone, validator: validatePhone },
      { field: 'recipientEmail', value: currentRecipientEmail, validator: validateEmail },
    ]);

    if (!isValid) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFieldErrors({});
    void validateRequired;

    const payload = {
      shippingMethod,
      paymentMethod,
      invoiceType,
      promoCode: isPromoApplied ? promoCode : null,
      // TODO: [BACKEND] 收件人資料欄位請依後端 API 規格補充
      // TODO: [BACKEND] 金額由後端計算，前端不傳遞 subtotal/total
    };

    try {
      // TODO: [BACKEND] orderService.createOrder 需後端
      //   POST /store/carts/:id/complete 實作
      // 後端實作後回傳 { order: { id: 'PL-XXXX' } }
      const data = await orderService.createOrder(payload);
      const orderId = data?.order?.id ?? data?.id;

      if (!orderId) {
        throw new Error('訂單送出需後端支援，目前無法完成');
      }

      await clearCart();
      navigate(
        ROUTES.ORDER_CONFIRM.replace(':orderId', orderId),
        { state: { order: data?.order ?? data } }
      );
    } catch (err) {
      setSubmitError(err?.message || '訂單送出失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header-simple">
        <h1 className="headline-pro">安全結帳</h1>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <h2 className="section-title">1. 選擇運送方式</h2>
            <div className="option-grid">
              <div
                className={`option-card ${shippingMethod === 'store' ? 'active' : ''}`}
                onClick={() => setShippingMethod('store')}
              >
                <Store size={32} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">超商取貨</h3>
                <p className="option-desc">7-ELEVEN 交貨便</p>
                {shippingMethod === 'store' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${shippingMethod === 'home' ? 'active' : ''}`}
                onClick={() => setShippingMethod('home')}
              >
                <Truck size={32} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">黑貓宅配</h3>
                <p className="option-desc">常溫配送到府</p>
                {shippingMethod === 'home' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="section-title">2. 填寫聯絡與配送資訊</h2>

            <div className="form-group">
              <h3 className="form-subtitle">購買人資訊</h3>
              <div className="form-row">
                <input
                  id={sameAsBuyer ? 'recipientName' : undefined}
                  type="text"
                  className="apple-input"
                  placeholder="購買人真實姓名"
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (sameAsBuyer) {
                      setFieldErrors((prev) => ({ ...prev, recipientName: '' }));
                    }
                  }}
                />
                {sameAsBuyer && fieldErrors.recipientName && (
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
                    value={buyerEmail}
                    onChange={(e) => {
                      setBuyerEmail(e.target.value);
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
                    id={sameAsBuyer ? 'recipientPhone' : undefined}
                    type="tel"
                    className="apple-input"
                    placeholder="手機號碼（例：0912345678）"
                    maxLength={10}
                    value={buyerPhone}
                    onChange={(e) => {
                      setBuyerPhone(e.target.value.replace(/\D/g, ''));
                      if (sameAsBuyer) {
                        setFieldErrors((prev) => ({ ...prev, recipientPhone: '' }));
                      }
                    }}
                  />
                  {sameAsBuyer && fieldErrors.recipientPhone && (
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
                checked={sameAsBuyer}
                onChange={(e) => setSameAsBuyer(e.target.checked)}
              />
              <label htmlFor="sameAsBuyer">收件人資料與購買人相同</label>
            </div>

            {!sameAsBuyer && (
              <div className="form-group slide-down">
                <h3 className="form-subtitle">收件人資訊</h3>
                <div className="form-row half-half">
                  <div>
                    <input
                      id="recipientName"
                      type="text"
                      className="apple-input"
                      placeholder="收件人真實姓名"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value);
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
                      value={recipientPhone}
                      onChange={(e) => {
                        setRecipientPhone(e.target.value.replace(/\D/g, ''));
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
              {shippingMethod === 'store' ? (
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
                className={`option-card ${paymentMethod === 'credit' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('credit')}
              >
                <CreditCard size={28} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">信用卡</h3>
                <p className="option-desc">免跳轉 安全支付</p>
                {paymentMethod === 'credit' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${paymentMethod === 'linepay' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('linepay')}
              >
                <Smartphone size={28} strokeWidth={1.5} className="option-icon line-color" />
                <h3 className="option-title">LINE Pay</h3>
                <p className="option-desc">快速授權</p>
                {paymentMethod === 'linepay' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${paymentMethod === 'applepay' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('applepay')}
              >
                <Smartphone size={28} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">Apple Pay</h3>
                <p className="option-desc">快速驗證付款</p>
                {paymentMethod === 'applepay' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
              <div
                className={`option-card ${paymentMethod === 'transfer' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('transfer')}
              >
                <Store size={28} strokeWidth={1.5} className="option-icon" />
                <h3 className="option-title">ATM 虛擬帳號</h3>
                <p className="option-desc">轉帳付款</p>
                {paymentMethod === 'transfer' && <CheckCircle2 className="check-icon" size={20} />}
              </div>
            </div>

            {paymentMethod === 'credit' && import.meta.env.DEV && (
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

            {paymentMethod === 'credit' && (
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
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                >
                  <option value="member">會員載具</option>
                  <option value="mobile">手機條碼載具</option>
                  <option value="company">公司戶發票</option>
                  <option value="donate">愛心捐贈發票</option>
                </select>
              </div>

              {invoiceType === 'mobile' && (
                <div className="form-row slide-down">
                  <div className="input-with-icon">
                    <Smartphone className="input-icon" size={20} />
                    <input
                      type="text"
                      className="apple-input with-icon"
                      placeholder="請輸入手機條碼（格式：/ABC1234）"
                      value={invoiceMobile}
                      onChange={(e) => setInvoiceMobile(e.target.value)}
                      maxLength={8}
                    />
                  </div>
                </div>
              )}

              {invoiceType === 'company' && (
                <div className="form-row half-half slide-down">
                  <div className="input-with-icon">
                    <Building2 className="input-icon" size={20} />
                    <input
                      type="text"
                      className="apple-input with-icon"
                      placeholder="統一編號（8 碼數字）"
                      value={invoiceTaxId}
                      onChange={(e) => setInvoiceTaxId(e.target.value)}
                      maxLength={8}
                    />
                  </div>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="公司抬頭"
                    value={invoiceCompany}
                    onChange={(e) => setInvoiceCompany(e.target.value)}
                  />
                </div>
              )}

              {invoiceType === 'donate' && (
                <div className="form-row slide-down">
                  <div className="input-with-icon">
                    <HeartHandshake className="input-icon" size={20} />
                    <input
                      type="text"
                      className="apple-input with-icon"
                      placeholder="請輸入機構捐贈碼"
                      value={invoiceDonateCode}
                      onChange={(e) => setInvoiceDonateCode(e.target.value)}
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
              <div className="calc-row total">
                <span>總計</span>
                <span>NT${total.toLocaleString()}</span>
              </div>
            </div>

            <div className="checkout-agreements">
              <input type="checkbox" id="agree" defaultChecked />
              <label htmlFor="agree">
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
