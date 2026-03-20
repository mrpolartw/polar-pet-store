import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { sdk } from '../../lib/medusa'
import { formatPrice } from '../../utils/format'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      navigate('/')
      return
    }

    let mounted = true

    sdk.store.order.retrieve(orderId, {
      fields: '+items,+items.variant,+shipping_address,+payment_collections',
    })
      .then(({ order: nextOrder }) => {
        if (mounted) {
          setOrder(nextOrder)
        }
      })
      .catch(() => {
        if (mounted) {
          navigate('/')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [navigate, orderId])

  if (loading) {
    return <div className="checkout-loading">載入中...</div>
  }

  if (!order) {
    return null
  }

  return (
    <main className="order-confirm-page">
      <div className="order-confirm-card">
        <div className="order-confirm-icon">✅</div>
        <h1 className="order-confirm-title">訂單已成立！</h1>
        <p className="order-confirm-subtitle">
          訂單編號：<strong>#{order.display_id}</strong>
        </p>
        <div className="order-confirm-items">
          {order.items?.map((item) => (
            <div key={item.id} className="order-confirm-item">
              <img src={item.thumbnail || '/placeholder.jpg'} alt={item.title} />
              <span>{item.title}</span>
              <span>x{item.quantity}</span>
              <span>{formatPrice((item.subtotal || 0) / 100)}</span>
            </div>
          ))}
        </div>
        <div className="order-confirm-total">
          總計：<strong>{formatPrice((order.total || 0) / 100)}</strong>
        </div>
        <div className="order-confirm-actions">
          <Link to="/account" className="btn-blue">查看訂單記錄</Link>
          <Link to="/products" className="btn-outline">繼續購物</Link>
        </div>
      </div>
    </main>
  )
}
