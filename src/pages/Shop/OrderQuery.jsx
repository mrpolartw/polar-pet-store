import React, { useEffect, useState } from 'react';
import { Search, Package, Truck, CheckCircle2, Clock, Phone, Hash, ShoppingBag } from 'lucide-react';
import { getCustomerOrders } from '../../api/orders';
import { useAuth } from '../../context/useAuth';
import { sdk } from '../../lib/medusa';
import './OrderQuery.css';

// ── Mock 訂單資料（替換為真實 API 呼叫）──
const MOCK_ORDERS = {
    'PL-20260001': {
        id: 'PL-20260001',
        date: '2026-03-10',
        status: 'delivered',
        phone: '0912345678',
        recipient: { name: '王小明' },
        shippingMethod: 'home',
        paymentMethod: 'credit',
        items: [
            {
                id: 1,
                name: 'Polar 頂級鮭魚糧',
                specs: '成貓配方 / 1.5kg',
                quantity: 2,
                price: 890,
                image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=200',
            },
            {
                id: 2,
                name: 'Polar Joint 關節保健',
                specs: '大型犬 / 60顆',
                quantity: 1,
                price: 1290,
                image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200',
            },
        ],
        subtotal: 3070,
        shippingFee: 100,
        discount: 0,
        total: 3170,
        timeline: [
            { label: '訂單成立', time: '2026-03-10 14:32', done: true },
            { label: '備貨中',   time: '2026-03-10 16:00', done: true },
            { label: '已出貨',   time: '2026-03-11 09:15', done: true },
            { label: '已送達',   time: '2026-03-12 13:40', done: true },
        ],
    },
    'PL-20260002': {
        id: 'PL-20260002',
        date: '2026-03-14',
        status: 'shipped',
        phone: '0987654321',
        recipient: { name: '陳美麗' },
        shippingMethod: 'store',
        paymentMethod: 'linepay',
        items: [
            {
                id: 3,
                name: 'Polar 幼貓啟蒙糧',
                specs: '幼貓配方 / 800g',
                quantity: 3,
                price: 650,
                image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=200',
            },
        ],
        subtotal: 1950,
        shippingFee: 0,
        discount: 200,
        promoCode: 'POLAR2026',
        total: 1750,
        timeline: [
            { label: '訂單成立', time: '2026-03-14 10:20', done: true },
            { label: '備貨中',   time: '2026-03-14 12:00', done: true },
            { label: '運送中',   time: '2026-03-15 08:30', done: true },
            { label: '等待取貨', time: '—',                done: false },
        ],
    },
    'PL-20260003': {
        id: 'PL-20260003',
        date: '2026-03-15',
        status: 'processing',
        phone: '0987654321', // 同手機兩筆訂單，示範多筆結果
        recipient: { name: '陳美麗' },
        shippingMethod: 'home',
        paymentMethod: 'transfer',
        items: [
            {
                id: 4,
                name: 'Polar 深海魚油',
                specs: '全齡犬貓 / 120ml',
                quantity: 2,
                price: 480,
                image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200',
            },
            {
                id: 5,
                name: 'Polar 益生菌保健',
                specs: '成犬配方 / 90包',
                quantity: 1,
                price: 990,
                image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=200',
            },
        ],
        subtotal: 1950,
        shippingFee: 100,
        discount: 0,
        total: 2050,
        timeline: [
            { label: '訂單成立', time: '2026-03-15 09:00', done: true },
            { label: '備貨中',   time: '2026-03-15 10:00', done: true },
            { label: '尚未出貨', time: '—',                done: false },
            { label: '尚未送達', time: '—',                done: false },
        ],
    },
};

const STATUS_MAP = {
    ordered:    { label: '訂單成立', color: '#003153' },
    processing: { label: '備貨中',   color: '#8B5A2B' },
    shipped:    { label: '運送中',   color: '#c48c58' },
    delivered:  { label: '已完成',   color: '#2e7d32' },
};

const PAYMENT_LABELS = {
    credit:   '信用卡付款',
    linepay:  'LINE Pay',
    applepay: 'Apple Pay',
    transfer: 'ATM 轉帳',
};

const formatPrice = (amount) =>
    "NT$" + Math.round(Number(amount) || 0).toLocaleString("zh-TW");
const formatDate  = (s) => {
    const d = new Date(s);
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
};

// 姓名遮罩：王小明 → 王*明 ／ 陳美 → 陳*
const getStatusClass = (status) => {
    const map = {
        pending: 'processing',
        processing: 'processing',
        shipped: 'shipped',
        delivered: 'delivered',
        completed: 'delivered',
        canceled: 'processing',
        cancelled: 'processing',
    };

    return map[status] || 'processing';
};

const buildTimeline = (order) => {
    const createdAt = order?.created_at
        ? new Date(order.created_at).toLocaleString('zh-TW')
        : '';
    const updatedAt = order?.updated_at
        ? new Date(order.updated_at).toLocaleString('zh-TW')
        : '';
    const statusClass = getStatusClass(order?.status);

    return [
        { label: '訂單建立', time: createdAt, done: true },
        { label: '處理中', time: updatedAt, done: true },
        { label: '配送中', time: statusClass === 'shipped' || statusClass === 'delivered' ? updatedAt : '', done: statusClass === 'shipped' || statusClass === 'delivered' },
        { label: '已送達', time: statusClass === 'delivered' ? updatedAt : '', done: statusClass === 'delivered' },
    ];
};

const normalizeOrder = (order) => {
    const paymentProviderId =
        order?.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id || '';
    const normalizedStatus = getStatusClass(order?.status);

    return {
        ...order,
        id: `#${order?.display_id || order?.id || ''}`,
        date: order?.created_at || '',
        status: normalizedStatus === 'shipped' ? 'shipped' : normalizedStatus,
        phone: order?.shipping_address?.phone || '',
        recipient: {
            name: order?.shipping_address?.first_name || '',
        },
        shippingMethod: order?.shipping_methods?.[0]?.name?.toLowerCase().includes('store') ? 'store' : 'home',
        paymentMethod: paymentProviderId.includes('line') ? 'linepay' : paymentProviderId.includes('apple') ? 'applepay' : paymentProviderId.includes('transfer') ? 'transfer' : 'credit',
        items: (order?.items || []).map((item) => ({
            id: item?.id,
            name: item?.title || item?.product_title || '',
            specs: item?.variant_title || '',
            quantity: Number(item?.quantity || 0),
            price: Number(item?.unit_price || 0) / 100,
            image: item?.thumbnail || '/placeholder.jpg',
        })),
        subtotal: Number(order?.subtotal || 0) / 100,
        shippingFee: Number(order?.shipping_total || 0) / 100,
        discount: Number(order?.discount_total || 0) / 100,
        promoCode: order?.promotions?.[0]?.code || '',
        total: Number(order?.total || 0) / 100,
        timeline: buildTimeline(order),
    };
};

const maskName = (name) => {
    if (!name) return '';
    if (name.length === 1) return name;
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*' + name[name.length - 1];
};

// ── 單筆訂單結果元件 ──
function OrderResult({ order, searchMode }) {
    const currentStatus = STATUS_MAP[getStatusClass(order.status)] || STATUS_MAP.processing;

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
                                    {PAYMENT_LABELS[order.paymentMethod]}
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
    const { isLoggedIn } = useAuth();
    const [orders, setOrders] = useState([]);
    const [orderId,    setOrderId]    = useState('');
    const [phone,      setPhone]      = useState('');
    const [isLoading,  setIsLoading]  = useState(false);
    const [queryEmail, setQueryEmail] = useState('');
    const [queryResult, setQueryResult] = useState(null);
    const [searchMode, setSearchMode] = useState(null); // 'orderId' | 'phone'
    const [orderData,  setOrderData]  = useState(null); // 單筆結果
    const [orderList,  setOrderList]  = useState([]);   // 多筆結果（電話查詢）
    const [error,      setError]      = useState('');
    const [searched,   setSearched]   = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            setOrders([]);
            return;
        }

        const fetchOrders = async () => {
            setIsLoading(true);

            try {
                void sdk;
                const { orders: fetchedOrders } = await getCustomerOrders({ limit: 20 });
                const normalizedOrders = fetchedOrders.map(normalizeOrder);
                setOrders(normalizedOrders);
                setOrderList(normalizedOrders);
                setOrderData(null);
                setQueryResult(normalizedOrders);
                setSearchMode('phone');
            } catch {
                setError('訂單載入失敗，請稍後再試');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [isLoggedIn]);

    const handleSearch = (e) => {
        e.preventDefault();
        setError('');

        const trimmedId = orderId.trim().toUpperCase();
        const trimmedPhone = phone.trim();

        if (!isLoggedIn) {
            setError('請先登入會員後查詢訂單');
            return;
        }

        if (!trimmedId && !trimmedPhone) {
            setError('請輸入訂單編號或手機號碼');
            return;
        }

        if (trimmedPhone && !/^09\d{8}$/.test(trimmedPhone)) {
            setError('手機號碼格式不正確，請輸入 09 開頭 10 碼');
            return;
        }

        const mode = trimmedId ? 'orderId' : 'phone';
        const matchedOrders = orders.filter((order) =>
            mode === 'orderId'
                ? String(order.id).replace('#', '') === trimmedId.replace('#', '')
                : order.phone === trimmedPhone
        );

        setSearchMode(mode);
        setSearched(true);
        setOrderData(mode === 'orderId' ? matchedOrders[0] || null : null);
        setOrderList(mode === 'phone' ? matchedOrders : []);
        setQueryEmail(trimmedPhone);
        setQueryResult(matchedOrders);

        if (matchedOrders.length === 0) {
            setError(mode === 'orderId' ? '找不到此訂單資料' : '查無符合的訂單資料');
        }

        return;
        /*

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

        // 模擬 API delay（替換為 fetch / axios）
        setTimeout(() => {
            if (mode === 'orderId') {
                const found = MOCK_ORDERS[trimmedId];
                if (found) {
                    setOrderData(found);
                } else {
                    setError('查無此訂單編號，請確認輸入是否正確。');
                }
            } else {
                // ✦ 電話查詢：同一支手機可能有多筆訂單
                const found = Object.values(MOCK_ORDERS).filter(
                    (o) => o.phone === trimmedPhone
                );
                if (found.length > 0) {
                    setOrderList(found);
                } else {
                    setError('查無相關訂單，請確認手機號碼是否正確。');
                }
            }
            setIsLoading(false);
        }, 900);
        */
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
