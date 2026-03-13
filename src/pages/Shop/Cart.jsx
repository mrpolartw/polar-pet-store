import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// 引入 Gift (禮物) 圖示來取代原本的加號
import { Package, Gift, Trash2 } from 'lucide-react'; 

const Cart = () => {
    // 模擬購物車資料 (加入 gift 與 shippingMethods 欄位)
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'Polar 鮮糧 - 經典放山雞',
            specs: '2kg / 適合全齡犬',
            price: 1280,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=600',
            gift: '寵物隨手包 x2', // 該商品的贈品
            shippingMethods: ['黑貓宅急便', '7-ELEVEN超商取貨'] // 該商品的配送方式
        },
        {
            id: 2,
            name: '特級超級視力寶',
            specs: '60 顆 / 護眼保健',
            price: 850,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=600',
            gift: '專屬品牌量匙 x1',
            shippingMethods: ['黑貓宅急便', '全家超商取貨', '7-ELEVEN超商取貨']
        }
    ]);

    // 價格格式化小工具
    const formatPrice = (price) => {
        return `NT$${price.toLocaleString()}`;
    };

    // 計算總計
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingFee = subtotal >= 1500 ? 0 : 100; // 滿 1500 免運
    const total = subtotal + shippingFee;

    // 處理數量變更
    const handleQuantityChange = (id, newQuantity) => {
        setCartItems(cartItems.map(item => 
            item.id === id ? { ...item, quantity: Number(newQuantity) } : item
        ));
    };

    // 處理刪除商品
    const handleRemoveItem = (id) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-page empty">
                <h1 className="headline-pro">購物袋是空的。</h1>
                <p className="subhead-pro" style={{ marginTop: '20px' }}>
                    <Link to="/products" className="btn-link">繼續選購商品</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="cart-page">
            {/* --- 購物袋標題區 --- */}
            <div className="cart-header">
                <h1 className="headline-regular">以下是你購物袋內的商品<br className="mobile-only"/> {formatPrice(total)}。</h1>
                {/* 修改 1：將免運提示改為確認商品提示 */}
                <p className="cart-shipping-promo">
                    請確認以下商品是否正確無誤。
                </p>
                <Link to="/Checkout" className="btn-blue btn-checkout-large" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>結帳</Link>
            </div>

            {/* --- 商品列表區 --- */}
            <div className="cart-items-container">
                {cartItems.map((item) => (
                    <div className="cart-item" key={item.id}>
                        <div className="item-image-col">
                            <img src={item.image} alt={item.name} />
                        </div>
                        
                        <div className="item-content-col">
                            <div className="item-main-info">
                                <div className="item-details">
                                    <h3 className="item-title">{item.name}</h3>
                                    <p className="item-specs">{item.specs}</p>
                                </div>
                                <div className="item-qty">
                                    <select 
                                        value={item.quantity} 
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        className="qty-select"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="item-price-col">
                                    <p className="item-price-text">{formatPrice(item.price * item.quantity)}</p>
                                    <button className="btn-remove" onClick={() => handleRemoveItem(item.id)}>移除</button>
                                </div>
                            </div>

                            {/* 修改 2：贈品顯示區塊 */}
                            {item.gift && (
                                <div className="item-extra-service" style={{ color: 'var(--color-brand-coffee)' }}>
                                    <Gift size={18} strokeWidth={1.5} />
                                    <span style={{ fontWeight: '500' }}>贈品：【{item.gift}】</span>
                                </div>
                            )}

                            {/* 修改 3：可配送方式顯示區塊 */}
                            <div className="item-fulfillment">
                                <div className="fulfillment-option">
                                    <Package size={18} className="icon" />
                                    <div>
                                        <strong>此商品可配送方式：</strong>
                                        {/* 將陣列組合為 【XXXX】、【XXXX】 的格式 */}
                                        <p>【{item.shippingMethods.join('】、【')}】</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- 總結算區 --- */}
            <div className="cart-summary-section">
                <div className="summary-details">
                    <div className="summary-row">
                        <span>小計</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="summary-row">
                        <span>運費</span>
                        <span>{shippingFee === 0 ? '免額外付費' : formatPrice(shippingFee)}</span>
                    </div>
                    <div className="summary-row total-row">
                        <span>你的總金額</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div className="summary-tax-info">
                        包含營業稅 NT${Math.round(total * 0.05).toLocaleString()}
                    </div>
                </div>
                
                <div className="summary-actions">
                    <Link to="/checkout" className="btn-blue btn-checkout-large" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>結帳</Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;