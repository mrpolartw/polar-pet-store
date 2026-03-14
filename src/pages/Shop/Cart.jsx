import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Gift, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, subtotal } = useCart()

  const formatPrice = (price) => `NT$${price.toLocaleString()}`
  const shippingFee = subtotal >= 1500 ? 0 : 100
  const total = subtotal + shippingFee

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty">
        <h1 className="headline-pro">是不是還沒加入商品呢?</h1>
        <p className="subhead-pro" style={{ marginTop: 20 }}>
          <Link to="/products" className="btn-link">繼續購物</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="cart-page">
      {/* ── Header ── */}
      <div className="cart-header">
        <h1 className="headline-regular">
          購物車<br className="mobile-only" />{formatPrice(total)}
        </h1>
        <p className="cart-shipping-promo">消費滿 NT$1,500 免運費</p>
        <Link
          to="/checkout"
          className="btn-blue btn-checkout-large"
          style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
        >
          前往結帳
        </Link>
      </div>

      {/* ── 商品列表 ── */}
      <div className="cart-items-container">
        {cartItems.map(item => (
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
                    onChange={e => updateQuantity(item.id, e.target.value)}
                    className="qty-select"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="item-price-col">
                <p className="item-price-text">{formatPrice(item.price * item.quantity)}</p>
                <button className="btn-remove" onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={16} /> 刪除
                </button>
              </div>
              {item.gift && (
                <div className="item-extra-service" style={{ color: 'var(--color-brand-coffee)' }}>
                  <Gift size={18} strokeWidth={1.5} />
                  <span style={{ fontWeight: 500 }}>{item.gift}</span>
                </div>
              )}
              <div className="item-fulfillment">
                <div className="fulfillment-option">
                  <Package size={18} className="icon" />
                  <div>
                    <strong>配送方式</strong>
                    <p>{item.shippingMethods.join(' / ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 金額摘要 ── */}
      <div className="cart-summary-section">
        <div className="summary-details">
          <div className="summary-row">
            <span>小計</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>運費</span>
            <span>{shippingFee === 0 ? '免運費' : formatPrice(shippingFee)}</span>
          </div>
          <div className="summary-row total-row">
            <span>總計</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="summary-tax-info">
            含稅 NT${Math.round(total * 0.05).toLocaleString()}
          </div>
        </div>
        <div className="summary-actions">
          <Link
            to="/checkout"
            className="btn-blue btn-checkout-large"
            style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
          >
            前往結帳
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart
