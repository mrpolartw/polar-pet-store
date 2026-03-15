import React, { useState } from 'react';
import { Truck, Store, CreditCard, Smartphone, CheckCircle2, Ticket, Receipt, Building2, HeartHandshake, ShieldCheck } from 'lucide-react';

const Checkout = () => {
    // --- 核心狀態管理 ---
    const [shippingMethod, setShippingMethod] = useState('store'); // 'store' 或 'home'
    const [paymentMethod, setPaymentMethod] = useState('credit'); // 'credit', 'linepay', 'applepay', 'transfer'
    
    // --- 顧客與收件資訊 ---
    const [sameAsBuyer, setSameAsBuyer] = useState(true);
    
    // --- 發票邏輯狀態 ---
    const [invoiceType, setInvoiceType] = useState('member'); // member, mobile, company, donate
    const [invoiceMobile, setInvoiceMobile] = useState('');
    const [invoiceTaxId, setInvoiceTaxId] = useState('');
    const [invoiceCompany, setInvoiceCompany] = useState('');
    const [invoiceDonateCode, setInvoiceDonateCode] = useState('');

    // --- 折扣碼邏輯 ---
    const [promoCode, setPromoCode] = useState('');
    const [isPromoApplied, setIsPromoApplied] = useState(false);

    // 模擬計算
    const subtotal = 3410;
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

    const handleSubmitOrder = (e) => {
        e.preventDefault();
        // 這裡未來將串接後端 API 送出訂單
        console.log('送出訂單，準備進行 PayUni API 授權扣款...');
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
                                <input type="text" className="apple-input" placeholder="購買人真實姓名" />
                            </div>
                            <div className="form-row half-half">
                                <input type="email" className="apple-input" placeholder="電子郵件地址" />
                                <input type="tel" className="apple-input" placeholder="手機號碼 (例：0912345678)" maxLength={10} />
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
                                    <input type="text" className="apple-input" placeholder="收件人真實姓名 (取貨核對用)" />
                                    <input type="tel" className="apple-input" placeholder="收件人手機號碼" maxLength={10} />
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

                            {/* 動態渲染：手機載具 */}
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

                            {/* 動態渲染：公司戶統編 */}
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

                            {/* 動態渲染：捐贈碼 */}
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
                            <textarea className="apple-input textarea-input" placeholder="有什麼特別需求想告訴我們的嗎？例如：請大樓管理員代收、希望的出貨包裝細節等。"></textarea>
                        </div>
                    </section>

                </div>

                {/* 右側：訂單摘要區 (Sticky 固定) */}
                <div className="checkout-sidebar">
                    <div className="summary-sticky-card">
                        <h2 className="summary-title">訂單摘要</h2>
                        
                        <div className="summary-items-preview">
                            <div className="preview-item">
                                <img src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=150" alt="商品" />
                                <div className="preview-info">
                                    <h4>Polar 鮮糧 - 經典放山雞</h4>
                                    <p>數量: 2</p>
                                </div>
                                <span>NT$2,560</span>
                            </div>
                            <div className="preview-item">
                                <img src="https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=150" alt="商品" />
                                <div className="preview-info">
                                    <h4>特級超級視力寶</h4>
                                    <p>數量: 1</p>
                                </div>
                                <span>NT$850</span>
                            </div>
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

                        <div className="checkout-agreements">
                            <input type="checkbox" id="agree" defaultChecked />
                            <label htmlFor="agree">我已確認訂單無誤，並同意<a href="/">服務條款</a>與<a href="/">退換貨政策</a>。</label>
                        </div>

                        <button className="btn-blue btn-submit-order" onClick={handleSubmitOrder}>
                            {paymentMethod === 'credit' ? '確認付款並送出' : '送出訂單'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;