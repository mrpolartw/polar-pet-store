import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Store, CreditCard, Smartphone, CheckCircle2, Ticket, Receipt, Building2, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { getAddresses, createAddress } from '../../api/customer';
import { addShippingMethod, completeCart, updateCartAddress } from '../../api/cart';
import { sdk } from '../../lib/medusa';

const formatPrice = (amount) =>
    "NT$" + Math.round(Number(amount) || 0).toLocaleString("zh-TW");

const Checkout = () => {
    /*
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
    */

    const { cart, clearCart, applyPromoCode } = useCart();
    const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [checkoutCart, setCheckoutCart] = useState(cart);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedShippingOptionId, setSelectedShippingOptionId] = useState(null);
    const [step, setStep] = useState(1);
    const [shippingMethod, setShippingMethod] = useState('home');
    const [paymentMethod, setPaymentMethod] = useState('credit');
    const [sameAsBuyer, setSameAsBuyer] = useState(true);
    const [invoiceType, setInvoiceType] = useState('member');
    const [invoiceMobile, setInvoiceMobile] = useState('');
    const [invoiceTaxId, setInvoiceTaxId] = useState('');
    const [invoiceCompany, setInvoiceCompany] = useState('');
    const [invoiceDonateCode, setInvoiceDonateCode] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        shipping_type: 'home',
        city: '',
        province: '',
        address_1: '',
        address_2: '',
        store_id: '',
        store_name: '',
        recipient_name: '',
        recipient_phone: '',
        delivery_time: 'any',
        notes: '',
    });
    const [checkoutError, setCheckoutError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const activeCart = checkoutCart || cart;
    const subtotal = (activeCart?.subtotal || 0) / 100;
    const shippingFee = (activeCart?.shipping_total || 0) / 100;
    const discount = (activeCart?.discount_total || 0) / 100;
    const total = (activeCart?.total || 0) / 100 || subtotal;
    const previewItems = activeCart?.items || [];
    const previewItemOne = previewItems[0];
    const previewItemTwo = previewItems[1];
    const cityOptions = useMemo(
        () => Array.from(new Set(['台北市', '新北市', ...addresses.map((address) => address.city).filter(Boolean), formData.city].filter(Boolean))),
        [addresses, formData.city]
    );
    const provinceOptions = useMemo(
        () => Array.from(new Set(['大安區', ...addresses.map((address) => address.province).filter(Boolean), formData.province].filter(Boolean))),
        [addresses, formData.province]
    );

    const showError = (message) => {
        const nextMessage = message || '結帳失敗，請確認資料後再試';
        setCheckoutError(nextMessage);

        if (typeof window !== 'undefined') {
            window.alert(nextMessage);
        }
    };

    const syncFormFromAddress = (address) => {
        if (!address) return;

        setFormData((previous) => ({
            ...previous,
            city: address.city || previous.city,
            province: address.province || previous.province,
            address_1: address.address_1 || previous.address_1,
            address_2: address.address_2 || '',
            store_id: address.metadata?.store_id || '',
            store_name: address.metadata?.store_name || '',
            recipient_name: address.first_name || previous.recipient_name,
            recipient_phone: address.phone || previous.recipient_phone,
        }));

        if (address.metadata?.shipping_type === 'convenience') {
            setShippingMethod('store');
        }
    };

    const buildAddressPayloadFromForm = () => ({
        first_name: sameAsBuyer
            ? formData.first_name
            : (formData.recipient_name || formData.first_name),
        phone: sameAsBuyer
            ? formData.phone
            : (formData.recipient_phone || formData.phone),
        city: formData.city || '台北市',
        province: formData.province || '大安區',
        address_1: shippingMethod === 'store'
            ? (formData.store_name || formData.address_1 || '超商門市待確認')
            : formData.address_1,
        address_2: formData.address_2 || '',
        shipping_type: shippingMethod === 'store' ? 'convenience' : 'home',
        store_name: formData.store_name || undefined,
        store_id: formData.store_id || undefined,
    });

    const buildShippingAddress = (address) => ({
        first_name: sameAsBuyer
            ? formData.first_name
            : (formData.recipient_name || address?.first_name || formData.first_name),
        last_name: formData.last_name || '',
        phone: sameAsBuyer
            ? formData.phone
            : (formData.recipient_phone || address?.phone || formData.phone),
        address_1: address?.address_1 || (
            shippingMethod === 'store'
                ? (formData.store_name || formData.address_1 || '超商門市待確認')
                : formData.address_1
        ),
        address_2: address?.address_2 || formData.address_2 || '',
        city: address?.city || formData.city || '台北市',
        province: address?.province || formData.province || '大安區',
        country_code: address?.country_code || 'tw',
        postal_code: address?.postal_code || '',
    });

    const getSelectedAddress = () =>
        addresses.find((address) => address.id === selectedAddressId) || null;

    const resolveShippingOptionId = (options, method) => {
        if (!Array.isArray(options) || options.length === 0) {
            return null;
        }

        const preferredKeywords = method === 'store'
            ? ['store', 'pickup', 'pick up', '超商', '門市']
            : ['delivery', 'home', '宅配'];

        const matchedOption = options.find((option) => {
            const searchableText = [
                option.name,
                option.service_zone?.name,
                option.data?.name,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return preferredKeywords.some((keyword) =>
                searchableText.includes(String(keyword).toLowerCase())
            );
        });

        return matchedOption?.id || options[0]?.id || null;
    };

    const handleFormChange = (field) => (event) => {
        setFormData((previous) => ({
            ...previous,
            [field]: event.target.value,
        }));
    };

    const handleBuyerNameChange = (event) => {
        const value = event.target.value;
        const [firstName = '', ...restNames] = value.trim().split(/\s+/);

        setFormData((previous) => ({
            ...previous,
            first_name: firstName || value,
            last_name: restNames.join(' '),
        }));
    };

    const handleCitySelection = (event) => {
        const value = event.target.value;

        if (value.startsWith('address:')) {
            const addressId = value.replace('address:', '');
            const selectedAddress = addresses.find((address) => address.id === addressId);

            setSelectedAddressId(addressId);
            syncFormFromAddress(selectedAddress);
            return;
        }

        setSelectedAddressId(null);
        setFormData((previous) => ({
            ...previous,
            city: value,
        }));
    };

    const handleSetShippingAddress = async (address) => {
        if (!activeCart?.id) {
            throw new Error('購物車資料異常，請重新整理頁面');
        }

        const shippingAddress = buildShippingAddress(address);

        await sdk.store.cart.update(activeCart.id, {
            email: formData.email,
        });

        const updatedCart = await updateCartAddress(shippingAddress);

        setCheckoutCart(updatedCart);
        setStep(2);

        return updatedCart;
    };

    const handleSelectShipping = async (optionId) => {
        if (!optionId) {
            throw new Error('目前沒有可用的配送方式');
        }

        const updatedCart = await addShippingMethod(optionId);

        setCheckoutCart(updatedCart);
        setSelectedShippingOptionId(optionId);
        setStep(3);

        return updatedCart;
    };

    const handlePayment = async (workingCart) => {
        const cartForPayment = workingCart || activeCart;

        if (!cartForPayment?.id) {
            throw new Error('購物車資料異常，請重新整理頁面');
        }

        await sdk.store.payment.initiatePaymentSession(cartForPayment, {
            provider_id: 'pp_system_default',
        });

        const result = await completeCart();

        if (result?.type !== 'order' || !result.order) {
            throw new Error(result?.error?.message || '訂單建立失敗，請稍後再試');
        }

        setStep(4);
        clearCart();
        navigate(`/order-confirmation/${result.order.id}`);

        return result.order;
    };

    const handleStoreSelection = async () => {
        try {
            const address = getSelectedAddress() || addresses.find((item) => item.is_default_shipping) || addresses[0] || null;
            const cartWithAddress = await handleSetShippingAddress(address);
            const optionsResponse = await sdk.store.fulfillment.listCartOptions({
                cart_id: cartWithAddress.id,
            });
            const nextOptions = optionsResponse?.shipping_options || [];

            setShippingOptions(nextOptions);

            const optionId = resolveShippingOptionId(nextOptions, 'store');

            if (optionId) {
                await handleSelectShipping(optionId);
            }
        } catch (error) {
            showError(error?.message);
        }
    };

    const handleApplyPromo = async (e) => {
        e.preventDefault();

        if (!promoCode.trim()) return;

        const result = await applyPromoCode(promoCode.trim());

        setIsPromoApplied(result.success);
        setCheckoutError(result.success ? '' : (result.message || '優惠碼套用失敗，請稍後再試'));
    };

    const handleSubmitOrder = async (e) => {
        e?.preventDefault();

        if (!activeCart?.id) {
            showError('購物車資料異常，請重新整理頁面');
            return;
        }

        setIsSubmitting(true);
        setCheckoutError('');

        try {
            let address = getSelectedAddress();

            if (!address && shippingMethod === 'home' && !formData.address_1) {
                throw new Error('請填寫完整配送地址');
            }

            if (!address && formData.address_1) {
                const createdAddress = await createAddress(buildAddressPayloadFromForm());

                if (createdAddress) {
                    setAddresses((previous) => [...previous, createdAddress]);
                    setSelectedAddressId(createdAddress.id);
                    address = createdAddress;
                }
            }

            const cartWithAddress = await handleSetShippingAddress(address);
            const optionsResponse = await sdk.store.fulfillment.listCartOptions({
                cart_id: cartWithAddress.id,
            });
            const nextOptions = optionsResponse?.shipping_options || [];

            setShippingOptions(nextOptions);

            const optionId = selectedShippingOptionId || resolveShippingOptionId(nextOptions, shippingMethod);
            const cartWithShipping = await handleSelectShipping(optionId);

            await handlePayment(cartWithShipping);
        } catch (error) {
            showError(error?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        setCheckoutCart(cart);
    }, [cart]);

    useEffect(() => {
        if (!isAuthLoading && !isLoggedIn) {
            navigate('/login?redirect=/checkout');
        }
    }, [isAuthLoading, isLoggedIn, navigate]);

    useEffect(() => {
        setFormData((previous) => ({
            ...previous,
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            phone: user?.phone || '',
            email: user?.email || '',
        }));
    }, [user]);

    useEffect(() => {
        setFormData((previous) => ({
            ...previous,
            shipping_type: shippingMethod === 'store' ? 'convenience' : 'home',
        }));
    }, [shippingMethod]);

    useEffect(() => {
        if (!isLoggedIn) return;

        let mounted = true;

        const loadAddresses = async () => {
            try {
                const data = await getAddresses();

                if (!mounted) return;

                setAddresses(data || []);

                const defaultAddress = data?.find((address) => address.is_default_shipping) || data?.[0];

                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                    syncFormFromAddress(defaultAddress);
                }
            } catch (error) {
                if (mounted) {
                    setAddresses([]);
                    setCheckoutError(error?.message || '地址載入失敗，請稍後再試');
                }
            }
        };

        void loadAddresses();

        return () => {
            mounted = false;
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!activeCart?.id) {
            setShippingOptions([]);
            return;
        }

        let mounted = true;

        sdk.store.fulfillment.listCartOptions({ cart_id: activeCart.id })
            .then(({ shipping_options }) => {
                if (mounted) {
                    setShippingOptions(shipping_options || []);
                }
            })
            .catch(() => {
                if (mounted) {
                    setShippingOptions([]);
                }
            });

        return () => {
            mounted = false;
        };
    }, [activeCart?.id, shippingMethod, step]);

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
                                onClick={() => {
                                    setShippingMethod('store');
                                    setSelectedShippingOptionId(null);
                                }}
                            >
                                <Store size={32} strokeWidth={1.5} className="option-icon" />
                                <h3 className="option-title">超商取貨</h3>
                                <p className="option-desc">統一超商交貨便</p>
                                {shippingMethod === 'store' && <CheckCircle2 className="check-icon" size={20} />}
                            </div>
                            <div 
                                className={`option-card ${shippingMethod === 'home' ? 'active' : ''}`}
                                onClick={() => {
                                    setShippingMethod('home');
                                    setSelectedShippingOptionId(null);
                                }}
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
                                <input type="text" className="apple-input" placeholder="購買人真實姓名" value={`${formData.first_name}${formData.last_name ? ` ${formData.last_name}` : ''}`.trim()} onChange={handleBuyerNameChange} />
                            </div>
                            <div className="form-row half-half">
                                <input type="email" className="apple-input" placeholder="電子郵件地址" value={formData.email} onChange={handleFormChange('email')} />
                                <input type="tel" className="apple-input" placeholder="手機號碼 (例：0912345678)" maxLength={10} value={formData.phone} onChange={handleFormChange('phone')} />
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
                                    <input type="text" className="apple-input" placeholder="收件人真實姓名 (取貨核對用)" value={formData.recipient_name} onChange={handleFormChange('recipient_name')} />
                                    <input type="tel" className="apple-input" placeholder="收件人手機號碼" maxLength={10} value={formData.recipient_phone} onChange={handleFormChange('recipient_phone')} />
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: '24px' }}>
                            <h3 className="form-subtitle">配送細節</h3>
                            {shippingMethod === 'store' ? (
                                <div className="store-select-box">
                                    <p>{selectedAddressId ? '已套用預設地址與超商配送方式。' : '請先建立地址或套用預設地址，再選擇超商配送。'}</p>
                                    <button className="btn-blue btn-select-store" onClick={handleStoreSelection} type="button">開啟電子地圖選擇門市</button>
                                </div>
                            ) : (
                                <div className="slide-down">
                                    <div className="form-row half-half">
                                        <select className="apple-input select-input" value={selectedAddressId ? `address:${selectedAddressId}` : formData.city} onChange={handleCitySelection}>
                                            <option value="">選擇縣市</option>
                                            {addresses.map((address) => (
                                                <option key={address.id} value={`address:${address.id}`}>
                                                    {address.city} {address.address_1}
                                                </option>
                                            ))}
                                            {cityOptions.map((city) => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <select className="apple-input select-input" value={formData.province} onChange={handleFormChange('province')}>
                                            <option value="">選擇鄉鎮市區</option>
                                            {provinceOptions.map((province) => (
                                                <option key={province} value={province}>{province}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <input type="text" className="apple-input" placeholder="完整街道與門牌號碼" value={formData.address_1} onChange={handleFormChange('address_1')} />
                                    </div>
                                    <div className="form-row">
                                        <select className="apple-input select-input" value={formData.delivery_time} onChange={handleFormChange('delivery_time')}>
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
                            <textarea className="apple-input textarea-input" placeholder="有什麼特別需求想告訴我們的嗎？例如：請大樓管理員代收、希望的出貨包裝細節等。" value={formData.notes} onChange={handleFormChange('notes')}></textarea>
                        </div>
                    </section>

                </div>

                {/* 右側：訂單摘要區 (Sticky 固定) */}
                <div className="checkout-sidebar">
                    <div className="summary-sticky-card">
                        <h2 className="summary-title">訂單摘要</h2>
                        
                        <div className="summary-items-preview">
                            <div className="preview-item">
                                <img src={previewItemOne?.thumbnail || '/placeholder.jpg'} alt={previewItemOne?.title || '商品'} />
                                <div className="preview-info">
                                    <h4>{previewItemOne?.title || '尚未加入商品'}</h4>
                                    <p>數量: {previewItemOne?.quantity || 0}</p>
                                </div>
                                <span>{formatPrice((previewItemOne?.subtotal || 0) / 100)}</span>
                            </div>
                            <div className="preview-item">
                                <img src={previewItemTwo?.thumbnail || '/placeholder.jpg'} alt={previewItemTwo?.title || '商品'} />
                                <div className="preview-info">
                                    <h4>{previewItemTwo?.title || '尚未加入商品'}</h4>
                                    <p>數量: {previewItemTwo?.quantity || 0}</p>
                                </div>
                                <span>{formatPrice((previewItemTwo?.subtotal || 0) / 100)}</span>
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
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="calc-row">
                                <span>運費 ({shippingMethod === 'store' ? '超商' : '宅配'})</span>
                                <span>{shippingFee === 0 ? '免費' : `NT$${shippingFee}`}</span>
                            </div>
                            {isPromoApplied && (
                                <div className="calc-row discount">
                                    <span>優惠折扣 (POLAR2026)</span>
                                    <span>- {formatPrice(discount)}</span>
                                </div>
                            )}
                            <div className="calc-row total">
                                <span>總計</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>

                        <div className="checkout-agreements">
                            <input type="checkbox" id="agree" defaultChecked />
                            <label htmlFor="agree">我已確認訂單無誤，並同意<a href="/">服務條款</a>與<a href="/">退換貨政策</a>。</label>
                        </div>

                        <button className="btn-blue btn-submit-order" onClick={handleSubmitOrder} disabled={isSubmitting}>
                            {paymentMethod === 'credit' ? '確認付款並送出' : '送出訂單'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
