import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Gift, Trash2 } from 'lucide-react'

import { LoadingSpinner, EmptyState } from '../../components/common'
import SEOHead from '../../components/common/SEOHead'
import { CONFIG } from '../../constants/config'
import { ROUTES } from '../../constants/routes'
import { useCart } from '../../context/useCart'

const Cart = () => {
  const navigate = useNavigate()
  const { cartItems, isCartLoading, removeFromCart, updateQuantity, subtotal } = useCart()
  const quantityOptions = Array.from(
    { length: CONFIG.MAX_CART_QUANTITY },
    (_, index) => index + 1,
  )

  const formatPrice = (price) => `NT$${price.toLocaleString()}`
  const shippingFee =
    subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.SHIPPING_FEE
  const total = subtotal + shippingFee

  return (
    <div className="cart-page">
      <SEOHead title="購物袋" noIndex={true} />
      {isCartLoading ? (
        <LoadingSpinner
          size="large"
          fullPage={true}
          label="載入購物袋中..."
        />
      ) : cartItems.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="購物袋是空的"
          description="快去挑選適合毛孩的好物吧！"
          actionLabel="前往商品頁"
          onAction={() => navigate(ROUTES.PRODUCTS)}
        />
      ) : (
        <>
          <div className="cart-header">
            <h1 className="headline-regular">
              購物袋總金額
              <br className="mobile-only" />
              {formatPrice(total)}
            </h1>
            <p className="cart-shipping-promo">
              {shippingFee === 0
                ? '已享免運優惠'
                : `再差 ${formatPrice(CONFIG.FREE_SHIPPING_THRESHOLD - subtotal)} 即可免運`}
            </p>
            <Link
              to="/checkout"
              className="btn-blue btn-checkout-large"
              style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
            >
              前往結帳
            </Link>
          </div>

          <div className="cart-items-container">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="item-image-col">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="item-content-col">
                  <div className="item-main-info">
                    <div className="item-details">
                      <h3 className="item-title text-truncate-mobile">{item.name}</h3>
                      <p className="item-specs">{item.specs}</p>
                    </div>
                    <div className="item-qty">
                      <select
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        className="qty-select"
                      >
                        {quantityOptions.map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="item-price-col">
                    <p className="item-price-text">{formatPrice(item.price * item.quantity)}</p>
                    <button
                      className="btn-remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="移除此商品"
                    >
                      <Trash2 size={16} /> 移除此商品
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
                        <strong>可配送方式</strong>
                        <p>{item.shippingMethods.join(' / ')}</p>
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
                <span>商品金額</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>運費</span>
                <span>{shippingFee === 0 ? '免運費' : formatPrice(shippingFee)}</span>
              </div>
              <div className="summary-row total-row">
                <span>應付總額</span>
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
        </>
      )}
    </div>
  )
}

export default Cart
