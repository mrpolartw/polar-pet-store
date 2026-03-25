import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, CreditCard, Smartphone, CheckCircle2, Ticket, Receipt, Building2, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { sdk } from '../../lib/medusa';

const TW_CITIES = [
    '台北市','新北市','桃園市','台中市','台南市','高雄市',
    '基隆市','新竹市','嘉義市','新竹縣','苗栗縣','彰化縣',
    '南投縣','雲林縣','嘉義縣','屏東縣','宜蘭縣','花蓮縣',
    '台東縣','澎湖縣','金門縣','連江縣',
]

const Checkout = () => {
    const navigate = useNavigate()
    const { cartItems, cartId, subtotal, clearCart } = useCart()
    const { user } = useAuth()

    // --- 核心狀態管理 ---
    const [shippingMethod, setShippingMethod] = useState('store'); // 'store' 或 'home'
    const [paymentMethod, setPaymentMethod] = useState('credit'); // 'credit', 'linepay', 'applepay', 'transfer'

    // --- 購買人資訊 ---
    const [buyerName, setBuyerName] = useState(user?.name || '')
    const [buyerEmail, setBuyerEmail] = useState(user?.email || '')
    const [buyerPhone, setBuyerPhone] = useState(user?.phone || '')

    // --- 收件人資訊 ---
    const [sameAsBuyer, setSameAsBuyer] = useState(true);
    const [recipientName, setRecipientName] = useState('')
    const [recipientPhone, setRecipientPhone] = useState('')

    // --- 配送細節 ---
    const [city, setCity] = useState('')
    const [district, setDistrict] = useState('')
    const [streetAddress, setStreetAddress] = useState('')
    const [deliveryTime, setDeliveryTime] = useState('any')
    const [notes, setNotes] = useState('')

    // --- 運送選項 ---
    const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(null)

    // --- 發票邏輯狀態 ---
    const [invoiceType, setInvoiceType] = useState('member'); // member, mobile, company, donate
    const [invoiceMobile, setInvoiceMobile] = useState('');
    const [invoiceTaxId, setInvoiceTaxId] = useState('');
    const [invoiceCompany, setInvoiceCompany] = useState('');
    const [invoiceDonateCode, setInvoiceDonateCode] = useState('');

    // --- 折扣碼邏輯 ---
    const [promoCode, setPromoCode] = useState('');
    const [isPromoApplied, setIsPromoApplied] = useState(false);

    // --- 提交狀態 ---
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    // 預填登入會員資訊
    useEffect(() => {
        if (user) {
            setBuyerName(user.name || '')
            setBuyerEmail(user.email || '')
            setBuyerPhone(user.phone || '')
        }
    }, [user])

    // 取得可用的運送選項
    useEffect(() => {
        if (!cartId) return
        sdk.store.cart.listShippingOptions(cartId)
            .then(({ shipping_options }) => {
                if (shipping_options?.length > 0) {
                    setSelectedShippingOptionId(shipping_options[0].id)
                }
            })
            .catch(err => console.error('Failed to load shipping options:', err))
    }, [cartId])

    // 計算金額
    const shippingFee = shippingMethod === 'store' ? 0 : 100;
    const discount = isPromoApplied ? 200 : 0;
    const total = subtotal + shippingFee - discount;

    const handleApplyPromo = (e) => {
        e.preventDefault();
        if (promoCode === 'POLAR2026') {
            setIsPromoApplied(true);
        } else {
            alert('無效的優惠代碼');
        }
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        if (!cartId) { setSubmitError('購物車不存在，請重新加入商品'); return }
        if (cartItems.length === 0) { setSubmitError('購物車是空的'); return }

        const recipName  = sameAsBuyer ? buyerName  : recipientName
        const recipPhone = sameAsBuyer ? buyerPhone : recipientPhone

        if (!buyerName.trim())  { setSubmitError('請填寫購買人姓名'); return }
        if (!buyerEmail.trim()) { setSubmitError('請填寫電子郵件'); return }
        if (!buyerPhone.trim()) { setSubmitError('請填寫手機號碼'); return }

        if (shippingMethod === 'home') {
            if (!city || !district.trim() || !streetAddress.trim()) {
                setSubmitError('請填寫完整的配送地址'); return
            }
        }

        setIsSubmitting(true)
        setSubmitError('')

        try {
            // Step 1: 更新購物車的顧客與地址資訊
            const shippingAddress = shippingMethod === 'home'
                ? {
                    first_name: recipName.split(' ')[0] || recipName,
                    last_name:  recipName.split(' ').slice(1).join(' ') || '',
                    phone:       recipPhone,
                    address_1:   streetAddress,
                    city,
                    province:    district,
                    country_code: 'tw',
                }
                : {
                    first_name: recipName.split(' ')[0] || recipName,
                    last_name:  recipName.split(' ').slice(1).join(' ') || '',
                    phone:       recipPhone,
                    address_1:   '超商取貨',
                    city:        '—',
                    country_code: 'tw',
                }

            await sdk.store.cart.update(cartId, {
                email: buyerEmail,
                shipping_address: shippingAddress,
                ...(notes ? { metadata: { notes } } : {}),
            })

            // Step 2: 新增運送方式（若有可用選項）
            if (selectedShippingOptionId) {
                await sdk.store.cart.addShippingMethod(cartId, {
                    option_id: selectedShippingOptionId,
                })
            }

            // Step 3: 完成購物車 → 建立訂單
            const result = await sdk.store.cart.complete(cartId)

            if (result.type === 'order') {
                clearCart()
                navigate(`/order-success?id=${result.order.id}`)
            } else {
                setSubmitError('訂單建立失敗，請確認付款資訊後再試')
            }
        } catch (err) {
            console.error('Checkout error:', err)
            setSubmitError(err?.message || '結帳時發生錯誤，請稍後再試')
        } finally {
            setIsSubmitting(false)
        }
    };

    return (
        <div className="checkout-page">
            <div className="checkout-header-simple">
                <h1 className="headline-pro">安全結帳</h1>
            </div>

            <div className="checkout-layout">
                {/* 左側：表單填寫區 */}
                <div className="checkout-main">

                    {/* 1. 運送方式 */}
                    <section className="checkout-section">
                        <h2 className="section-title">1. 選擇運送方式</h2>
                        <div className="option-grid">
                            <div
                                className={`option-card ${shippingMethod === 'store' ? 'active' : ''}`}
                                onClick={() => setShippingMethod('store')}
                            >
                                <Store size={32} strokeWidth={1.5} className="option-icon" />
                                <h3 className="option-title">超商取貨</h3>
                                <p className="option-desc">統一超商交貨便</p>
                                {shippingMethod === 'store' && <CheckCircle2 className="check-icon" size={20} />}
                            </div>
                            <div
                                className={`option-card ${shippingMethod === 'home' ? 'active' : ''}`}
                                onClick={() => setShippingMethod('home')}
                            >
                                <Truck size={32} strokeWidth={1.5} className="option-icon" />
                                <h3 className="option-title">黑貓宅急便</h3>
                                <p className="option-desc">常溫配送到府</p>
                                {shippingMethod === 'home' && <CheckCircle2 className="check-icon" size={20} />}
                            </div>
                        </div>
                    </section>

                    {/* 2. 聯絡與配送資訊 */}
                    <section className="checkout-section">
                        <h2 className="section-title">2. 填寫聯絡與配送資訊</h2>

                        <div className="form-group">
                            <h3 className="form-subtitle">購買人資訊</h3>
                            <div className="form-row">
                                <input
                                    type="text"
                                    className="apple-input"
                                    placeholder="購買人真實姓名"
                                    value={buyerName}
                                    onChange={e => setBuyerName(e.target.value)}
                                />
                            </div>
                            <div className="form-row half-half">
                                <input
                                    type="email"
                                    className="apple-input"
                                    placeholder="電子郵件地址"
                                    value={buyerEmail}
                                    onChange={e => setBuyerEmail(e.target.value)}
                                />
                                <input
                                    type="tel"
                                    className="apple-input"
                                    placeholder="手機號碼 (例：0912345678)"
                                    maxLength={10}
                                    value={buyerPhone}
                                    onChange={e => setBuyerPhone(e.target.value)}
                                />
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
                                    <input
                                        type="text"
                                        className="apple-input"
                                        placeholder="收件人真實姓名 (取貨核對用)"
                                        value={recipientName}
                                        onChange={e => setRecipientName(e.target.value)}
                                    />
                                    <input
                                        type="tel"
                                        className="apple-input"
                                        placeholder="收件人手機號碼"
                                        maxLength={10}
                                        value={recipientPhone}
                                        onChange={e => setRecipientPhone(e.target.value)}
                                    />
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
                                        <select
                                            className="apple-input select-input"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                        >
                                            <option value="">選擇縣市</option>
                                            {TW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            className="apple-input"
                                            placeholder="鄉鎮市區（例：大安區）"
                                            value={district}
                                            onChange={e => setDistrict(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <input
                                            type="text"
                                            className="apple-input"
                                            placeholder="完整街道與門牌號碼"
                                            value={streetAddress}
                                            onChange={e => setStreetAddress(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <select
                                            className="apple-input select-input"
                                            value={deliveryTime}
                                            onChange={e => setDeliveryTime(e.target.value)}
                                        >
                                            <option value="any">配送時段：不限</option>
                                            <option value="morning">配送時段：13:00 前</option>
                                            <option value="afternoon">配送時段：14:00 - 18:00</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 3. 付款方式 (含 PayUni 免跳轉) */}
                    <section className="checkout-section">
                        <h2 className="section-title">3. 選擇付款方式</h2>
                        <div className="option-grid payment-grid">
                            <div className={`option-card ${paymentMethod === 'credit' ? 'active' : ''}`} onClick={() => setPaymentMethod('credit')}>
                                <CreditCard size={28} strokeWidth={1.5} className="option-icon" />
                                <h3 className="option-title">信用卡</h3>
                                <p className="option-desc">免跳轉 安全支付</p>
                                {paymentMethod === 'credit' && <CheckCircle2 className="check-icon" size={20} />}
                            </div>
                            <div className={`option-card ${paymentMethod === 'linepay' ? 'active' : ''}`} onClick={() => setPaymentMethod('linepay')}>
                                <Smartphone size={28} strokeWidth={1.5} className="option-icon line-color" />
                                <h3 className="option-title">LINE Pay</h3>
                                <p className="option-desc">快速授權</p>
                                {paymentMethod === 'linepay' && <CheckCircle2 className="check-icon" size={20} />}
                            </div>
                            <div className={`option-card ${paymentMethod === 'applepay' ? 'active' : ''}`} onClick={() => setPaymentMethod('applepay')}>
                                <Smartphone size={28} strokeWidth={1.5} className="option-icon" />
                                <h3 className="option-title">Apple Pay</h3>
                                <p className="option-desc">快速驗證付款</p>
                                {paymentMethod === 'applepay' && <CheckCircle2 className="check-icon" size={20} />}
                            </div>
                            <div className={`option-card ${paymentMethod === 'transfer' ? 'active' : ''}`} onClick={() => setPaymentMethod('transfer')}>
                                <Store size={28} strokeWidth={1.5} className="option-icon" />
                                <h3 className="option-title">ATM 虛擬帳號</h3>
                                <p className="option-desc">轉帳付款</p>
                                {paymentMethod === 'transfer' && <CheckCircle2 className="check-icon" size={20} />}
                            </div>
                        </div>

                        {/* PayUni 免跳轉 信用卡直接輸入區塊 */}
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

                    {/* 4. 發票與備註 (動態完整欄位) */}
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
                                    <option value="member">會員載具 (中獎將主動通知並寄送實體發票)</option>
                                    <option value="mobile">手機條碼載具</option>
                                    <option value="company">公司戶發票 (需打統編)</option>
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
                                            placeholder="請輸入手機條碼 (格式：/ 開頭加7位英數字，例：/ABC+123)"
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
                                            placeholder="統一編號 (8碼數字)"
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
                                            placeholder="請輸入機構捐贈碼 (留空預設捐贈予：台灣動物緊急救援小組)"
                                            value={invoiceDonateCode}
                                            onChange={(e) => setInvoiceDonateCode(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginTop: '24px' }}>
                            <h3 className="form-subtitle">訂單備註 (選填)</h3>
                            <textarea
                                className="apple-input textarea-input"
                                placeholder="有什麼特別需求想告訴我們的嗎？例如：請大樓管理員代收、希望的出貨包裝細節等。"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </section>

                </div>

                {/* 右側：訂單摘要區 (Sticky 固定) */}
                <div className="checkout-sidebar">
                    <div className="summary-sticky-card">
                        <h2 className="summary-title">訂單摘要</h2>

                        <div className="summary-items-preview">
                            {cartItems.length === 0 ? (
                                <p style={{ color: 'var(--color-gray-dark)', fontSize: 14, textAlign: 'center', padding: '12px 0' }}>購物車是空的</p>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.id} className="preview-item">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <div style={{ width: 56, height: 56, background: 'var(--color-bg-light)', borderRadius: 8, flexShrink: 0 }} />
                                        )}
                                        <div className="preview-info">
                                            <h4>{item.name}</h4>
                                            {item.specs && <p style={{ fontSize: 12, color: 'var(--color-gray-dark)' }}>{item.specs}</p>}
                                            <p>數量: {item.quantity}</p>
                                        </div>
                                        <span>NT${(item.price * item.quantity).toLocaleString()}</span>
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
                                    disabled={isPromoApplied}
                                />
                                <button onClick={handleApplyPromo} disabled={isPromoApplied || !promoCode}>
                                    {isPromoApplied ? '已套用' : '套用'}
                                </button>
                            </div>
                        </div>

                        <div className="summary-calc">
                            <div className="calc-row">
                                <span>小計</span>
                                <span>NT${subtotal.toLocaleString()}</span>
                            </div>
                            <div className="calc-row">
                                <span>運費 ({shippingMethod === 'store' ? '超商' : '宅配'})</span>
                                <span>{shippingFee === 0 ? '免費' : `NT$${shippingFee}`}</span>
                            </div>
                            {isPromoApplied && (
                                <div className="calc-row discount">
                                    <span>優惠折扣 (POLAR2026)</span>
                                    <span>-NT$200</span>
                                </div>
                            )}
                            <div className="calc-row total">
                                <span>總計</span>
                                <span>NT${total.toLocaleString()}</span>
                            </div>
                        </div>

                        {submitError && (
                            <div style={{ color: '#e74c3c', fontSize: 13, padding: '8px 0', textAlign: 'center' }}>
                                ⚠️ {submitError}
                            </div>
                        )}

                        <div className="checkout-agreements">
                            <input type="checkbox" id="agree" defaultChecked />
                            <label htmlFor="agree">我已確認訂單無誤，並同意<a href="/">服務條款</a>與<a href="/">退換貨政策</a>。</label>
                        </div>

                        <button
                            className="btn-blue btn-submit-order"
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting || cartItems.length === 0}
                        >
                            {isSubmitting ? '處理中...' : (paymentMethod === 'credit' ? '確認付款並送出' : '送出訂單')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
