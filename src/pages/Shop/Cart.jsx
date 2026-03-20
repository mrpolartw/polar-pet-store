import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Gift, Trash2 } from 'lucide-react'
import { useCart } from '../../context/useCart'
import { useAuth } from '../../context/useAuth'

const formatPrice = (amount) =>
  "NT$" + Math.round(Number(amount) || 0).toLocaleString("zh-TW")

const Cart = () => {
  const {
    cart,
    cartItems,
    removeFromCart,
    updateQuantity,
    subtotal,
    shippingTotal,
    discountTotal,
    total,
    isLoading,
  } = useCart()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const displayTotal = (cart?.total || 0) / 100 || total || subtotal

  const handleCheckout = (event) => {
    event?.preventDefault()

    if (!isLoggedIn) {
      navigate('/login?redirect=/checkout')
      return
    }

    navigate('/checkout')
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty">
        <h1 className="headline-pro">購物車目前是空的</h1>
        <p className="subhead-pro" style={{ marginTop: 20 }}>
          <Link to="/products" className="btn-link">前往商品頁</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="headline-regular">
          購物車<br className="mobile-only" />{formatPrice(displayTotal)}
        </h1>
        <p className="cart-shipping-promo">消費滿 NT$1,500 免運費</p>
        <Link
          to="/checkout"
          onClick={handleCheckout}
          className="btn-blue btn-checkout-large"
          style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
        >
          前往結帳
        </Link>
      </div>

      <div className="cart-items-container">
        {cartItems.map(item => (
          <div className="cart-item" key={item.id}>
            <div className="item-image-col">
              <img src={item.thumbnail || '/placeholder.jpg'} alt={item.title || item.name} />
            </div>
            <div className="item-content-col">
              <div className="item-main-info">
                <div className="item-details">
                  <h3 className="item-title">{item.title || item.name}</h3>
                  <p className="item-specs">{item.variant_title || item.variant?.title || item.specs}</p>
                </div>
                <div className="item-qty">
                  <select
                    value={item.quantity}
                    onChange={e => updateQuantity(item.id, Number(e.target.value))}
                    className="qty-select"
                    disabled={isLoading}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="item-price-col">
                <p className="item-price-text">
                  {formatPrice(
                    (item.subtotal || 0) / 100 ||
                    ((item.unit_price || 0) * item.quantity) / 100
                  )}
                </p>
                <button className="btn-remove" onClick={() => removeFromCart(item.id)} disabled={isLoading}>
                  <Trash2 size={16} /> 移除
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
                    <strong>配送資訊</strong>
                    <p>{item.variant_title || item.variant?.title || item.specs || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary-section">
        <div className="summary-details">
          <div className="summary-row">
            <span>小計</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>運費</span>
            <span>{shippingTotal > 0 ? formatPrice(shippingTotal) : '免運費'}</span>
          </div>
          <div className="summary-row total-row">
            <span>總計</span>
            <span>{formatPrice(displayTotal)}</span>
          </div>
          <div className="summary-tax-info">
            {discountTotal > 0
              ? `折扣 ${formatPrice(discountTotal)}`
              : `含稅 ${formatPrice(Math.round(displayTotal * 0.05))}`}
          </div>
        </div>
        <div className="summary-actions">
          <Link
            to="/checkout"
            onClick={handleCheckout}
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
