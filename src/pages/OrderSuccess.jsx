import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

import { ROUTES } from '../constants/routes'
import './OrderSuccess.css'

const OrderSuccess = () => {
  const location = useLocation()
  const orderId = location.state?.orderId
    ?? location.state?.order?.id
    ?? location.state?.order?.orderId
    ?? '--'

  return (
    <div className="os-page">
      <div className="os-inner">
        <div className="os-icon-wrapper">
          <CheckCircle2 size={36} color="#15803d" strokeWidth={1.8} />
        </div>

        <h1 className="os-title">訂單成立成功</h1>
        <p className="os-desc">感謝您的購買，我們已收到您的訂單並開始處理。</p>
        <p className="os-desc">後續付款、出貨與配送狀態，您都可以在訂單頁查看。</p>

        <p className="os-order-id-badge">
          訂單編號：<strong>{orderId}</strong>
        </p>

        <div className="os-btn-row">
          <Link to={ROUTES.ORDERS} className="btn-blue">
            查看訂單
          </Link>
          <Link to={ROUTES.PRODUCTS} className="os-btn-outline">
            繼續購物
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
