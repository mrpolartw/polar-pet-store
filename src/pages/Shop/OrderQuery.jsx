import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, Clock, Phone, Hash, ShoppingBag } from 'lucide-react';
import './OrderQuery.css';

const MEDUSA_API_URL = import.meta.env.VITE_MEDUSA_API_URL || 'http://localhost:9000';
const MEDUSA_API_KEY = import.meta.env.VITE_MEDUSA_API_KEY || '';

// ── 呼叫後端訂單查詢 API ──
const fetchOrders = async ({ order_id, phone }) => {
    const params = new URLSearchParams();
    if (order_id) params.set('order_id', order_id);
    if (phone)    params.set('phone', phone);

    const res = await fetch(
        `${MEDUSA_API_URL}/store/orders/query?${params.toString()}`,
        {
            headers: {
                'x-publishable-api-key': MEDUSA_API_KEY,
                'Content-Type': 'application/json',
            },
        }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '查詢失敗');
    return data.orders; // array
};

const STATUS_MAP = {
    ordered:    { label: '訂單成立', color: '#003153' },
    processing: { label: '備貨中',   color: '#8B5A2B' },
    shipped:    { label: '運送中',   color: '#c48c58' },
    delivered:  { label: '已完成',   color: '#2e7d32' },
    cancelled:  { label: '已取消',   color: '#9e9e9e' },
};

const PAYMENT_LABELS = {
    credit:   '信用卡付款',
    linepay:  'LINE Pay',
    applepay: 'Apple Pay',
    transfer: 'ATM 轉帳',
};

const formatPrice = (p) => `NT$${Number(p).toLocaleString()}`;
const formatDate  = (s) => {
    const d = new Date(s);
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
};

// 姓名遮罩：王小明 → 王*明 ／ 陳美 → 陳*
const maskName = (name) => {
    if (!name) return '';
    if (name.length === 1) return name;
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*' + name[name.length - 1];
};

// ── 單筆訂單結果元件 ──
function OrderResult({ order, searchMode }) {
    const currentStatus = STATUS_MAP[order.status];

    return (
        <div className="oq-order-block">
            {/* Status Banner */}
            <div className="oq-banner">
                <div className="oq-banner-inner">
                    <span className="oq-status-badge" style={{ background: currentStatus?.color }}>
                        {currentStatus?.label}
                    </span>
                    <div className="oq-banner-meta">
                        {/* ✦ 以訂單編號查詢 → 顯示訂單編號；以電話查詢 → 不顯示 */}
                        {searchMode === 'orderId' && (
                            <span>訂單編號：<strong>{order.id}</strong></span>
                        )}
                        <span>訂單日期：{formatDate(order.date)}</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="oq-grid">

                {/* Left Column */}
                <div className="oq-main-col">

                    {/* Timeline */}
                    <div className="oq-card">
                        <h3 className="oq-card-title">
                            <Package size={20} style={{ marginRight: 8 }} />
                            訂單進度
                        </h3>
                        <div className="oq-timeline">
                            {order.timeline.map((step, i) => (
                                <div key={i} className={`oq-step ${step.done ? 'done' : 'pending'}`}>
                                    <div className="oq-step-dot">
                                        {step.done ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                    </div>
                                    {i < order.timeline.length - 1 && (
                                        <div className={`oq-step-line ${order.timeline[i + 1].done ? 'done' : ''}`} />
                                    )}
                                    <div className="oq-step-body">
                                        <span className="oq-step-label">{step.label}</span>
                                        <span className="oq-step-time">{step.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Items */}
                    <div className="oq-card">
                        <h3 className="oq-card-title">
                            <ShoppingBag size={20} style={{ marginRight: 8 }} />
                            訂購商品
                        </h3>
                        <div className="oq-items">
                            {order.items.map((item) => (
                                <div key={item.id} className="oq-item-row">
                                    <img src={item.image} alt={item.name} className="oq-item-img" />
                                    <div className="oq-item-info">
                                        <p className="oq-item-name">{item.name}</p>
                                        <p className="oq-item-specs">{item.specs}</p>
                                        <p className="oq-item-qty">數量：{item.quantity}</p>
                                    </div>
                                    <span className="oq-item-price">
                                        {formatPrice(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Price Summary */}
                        <div className="oq-price-summary">
                            <div className="oq-price-row">
                                <span>商品小計</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="oq-price-row">
                                <span>運費</span>
                                <span>{order.shippingFee === 0 ? '免運費' : formatPrice(order.shippingFee)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="oq-price-row discount">
                                    <span>折扣（{order.promoCode}）</span>
                                    <span>－{formatPrice(order.discount)}</span>
                                </div>
                            )}
                            <div className="oq-price-row total">
                                <span>訂單總計</span>
                                <span>{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="oq-sidebar-col">

                    {/* ✦ 配送資訊：僅顯示配送方式 + 遮罩收件人 */}
                    <div className="oq-card">
                        <h3 className="oq-card-title">
                            <Truck size={20} style={{ marginRight: 8 }} />
                            配送資訊
                        </h3>
                        <div className="oq-info-rows">
                            <div className="oq-info-row">
                                <span className="oq-info-label">配送方式</span>
                                <span className="oq-info-value">
                                    {order.shippingMethod === 'store' ? '超商取貨' : '宅配到府'}
                                </span>
                            </div>
                            <div className="oq-info-row">
                                <span className="oq-info-label">收件人</span>
                                <span className="oq-info-value">{maskName(order.recipient.name)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="oq-card">
                        <h3 className="oq-card-title">付款資訊</h3>
                        <div className="oq-info-rows">
                            <div className="oq-info-row">
                                <span className="oq-info-label">付款方式</span>
                                <span className="oq-info-value">
                                    {order.paymentLabel || PAYMENT_LABELS[order.paymentMethod] || '線上付款'}
                                </span>
                            </div>
                            <div className="oq-info-row">
                                <span className="oq-info-label">付款狀態</span>
                                <span className="oq-paid-badge">已付款</span>
                            </div>
                        </div>
                    </div>

                    {/* Help */}
                    <div className="oq-card oq-help-card">
                        <p className="oq-help-text">如有任何訂單問題，歡迎聯絡我們的客服團隊</p>
                        <a href="/contact" className="btn-blue oq-help-btn">聯絡客服</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── 主頁面元件 ──
export default function OrderQuery() {
    const [orderId,    setOrderId]    = useState('');
    const [phone,      setPhone]      = useState('');
    const [isLoading,  setIsLoading]  = useState(false);
    const [searchMode, setSearchMode] = useState(null); // 'orderId' | 'phone'
    const [orderData,  setOrderData]  = useState(null); // 單筆結果
    const [orderList,  setOrderList]  = useState([]);   // 多筆結果（電話查詢）
    const [error,      setError]      = useState('');
    const [searched,   setSearched]   = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedId    = orderId.trim().toUpperCase();
        const trimmedPhone = phone.trim();

        // ✦ 驗證：至少填寫其中一項
        if (!trimmedId && !trimmedPhone) {
            return setError('請輸入訂單編號或手機號碼（擇一即可）');
        }
        if (trimmedPhone && !/^09\d{8}$/.test(trimmedPhone)) {
            return setError('手機號碼格式不正確（09 開頭共 10 碼）');
        }

        // ✦ 決定查詢模式：有填訂單編號優先以訂單編號查詢
        const mode = trimmedId ? 'orderId' : 'phone';
        setSearchMode(mode);
        setIsLoading(true);
        setSearched(true);
        setOrderData(null);
        setOrderList([]);

        try {
            const orders = await fetchOrders({
                order_id: trimmedId || undefined,
                phone:    trimmedPhone || undefined,
            });

            if (mode === 'orderId') {
                setOrderData(orders[0] || null);
            } else {
                setOrderList(orders);
            }
        } catch (err) {
            setError(err.message || '查詢失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    const hasResults = orderData !== null || orderList.length > 0;

    return (
        <main className="oq-page">
            <div className="orderquery-header-simple">
                <h1 className="headline-pro">訂單查詢</h1>
            </div>

            {/* ── Search Card ── */}
            <section className="oq-search-section">
                <div className="oq-search-card">
                    <form onSubmit={handleSearch} className="oq-form" noValidate>

                        {/* 訂單編號 */}
                        <div className="form-group">
                            <label className="oq-input-label">訂單編號</label>
                            <div className="input-with-icon">
                                <Hash size={18} className="input-icon" />
                                <input
                                    type="text"
                                    className="apple-input with-icon"
                                    placeholder="例：PL-20260001"
                                    value={orderId}
                                    onChange={(e) => {
                                        setOrderId(e.target.value.toUpperCase());
                                        setError('');
                                    }}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                        {/* 手機號碼 */}
                        <div className="form-group">
                            <label className="oq-input-label">手機號碼</label>
                            <div className="input-with-icon">
                                <Phone size={18} className="input-icon" />
                                <input
                                    type="tel"
                                    className="apple-input with-icon"
                                    placeholder="09xxxxxxxx"
                                    value={phone}
                                    maxLength={10}
                                    onChange={(e) => {
                                        setPhone(e.target.value.replace(/\D/g, ''));
                                        setError('');
                                    }}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {error && !isLoading && (
                            <p className="oq-error">{error}</p>
                        )}

                        <button type="submit" className="btn-blue oq-submit-btn" disabled={isLoading}>
                            {isLoading ? (
                                <span className="oq-dots">
                                    <span /><span /><span />
                                </span>
                            ) : (
                                <>
                                    <Search size={18} style={{ marginRight: 8 }} />
                                    查詢訂單
                                </>
                            )}
                        </button>
                    </form>

                    <div className="oq-demo-hint">
                        <span>請輸入 </span>
                        <strong>訂單編號</strong>
                        <span className="oq-demo-sep"> 或 </span>
                        <strong>手機號碼</strong>
                    </div>
                </div>
            </section>

            {/* ── 查詢結果 ── */}
            {!isLoading && hasResults && (
                <section className="oq-result-section">
                    {/* 電話查詢多筆提示 */}
                    {orderList.length > 1 && (
                        <p className="oq-multi-header">
                            共找到 <strong>{orderList.length}</strong> 筆訂單
                        </p>
                    )}

                    {/* 單筆（訂單編號查詢） */}
                    {orderData && (
                        <OrderResult order={orderData} searchMode={searchMode} />
                    )}

                    {/* 多筆（電話查詢） */}
                    {orderList.map((order, i) => (
                        <OrderResult key={order.id ?? i} order={order} searchMode={searchMode} />
                    ))}
                </section>
            )}

            {/* ── Not Found ── */}
            {!isLoading && searched && !hasResults && error && (
                <section className="oq-empty-section">
                    <div className="oq-empty-card">
                        <span className="oq-empty-icon">🔍</span>
                        <h3>找不到訂單</h3>
                        <p>{error}</p>
                        <p className="oq-empty-hint">
                            訂單編號格式範例：<strong>PL-20260001</strong>
                        </p>
                    </div>
                </section>
            )}
        </main>
    );
}
