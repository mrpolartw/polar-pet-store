import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, RotateCcw } from 'lucide-react'

import { ErrorState, LoadingSpinner } from '../../components/common'
import { ROUTES } from '../../constants/routes'
import orderService from '../../services/orderService'
import './OrderConfirm.css'

/**
 * @description 訂單確認頁
 * 路由：/order-confirm/:orderId
 * 前置條件：由 Checkout.jsx 送出訂單成功後 navigate 過來
 * 狀態：loading / error / success 三種
 */
const OrderConfirm = () => {
  const { orderId } = useParams()
  const location = useLocation()

  const locationOrder = location.state?.order ?? null

  const [order, setOrder] = useState(locationOrder)
  const [isLoading, setIsLoading] = useState(!locationOrder)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (locationOrder) return

    const fetchOrder = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // TODO: [BACKEND] orderService.getOrder 需後端
        //   GET /store/orders/:id 實作後才能取得真實訂單資料
        const data = await orderService.getOrder(orderId)
        const nextOrder = data?.order ?? data ?? null

        if (!nextOrder) {
          throw new Error('無法取得訂單資訊，請前往訂單查詢頁確認')
        }

        setOrder(nextOrder)
      } catch (err) {
        setError(err?.message || '無法取得訂單資訊，請前往訂單查詢頁確認')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, locationOrder])

  if (isLoading) {
    return (
      <div className="oc-page">
        <div className="oc-card">
          <LoadingSpinner size="large" label="正在確認訂單資訊⋯" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="oc-page">
        <div className="oc-card">
          <ErrorState
            message={error}
            onRetry={() => window.location.reload()}
            retryLabel="重新載入"
          />
          <div className="oc-btn-row oc-btn-row-spaced">
            <Link to={ROUTES.ORDER_QUERY} className="oc-btn btn-blue">
              前往訂單查詢
            </Link>
            <Link to={ROUTES.HOME} className="oc-btn oc-btn-outline">
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="oc-page">
      <div className="oc-card">
        <div className="oc-icon-wrapper">
          <CheckCircle2
            size={64}
            color="var(--color-brand-blue)"
            strokeWidth={1.5}
          />
        </div>

        <h1 className="oc-title">訂單已成立</h1>

        <div className="oc-order-id-box">
          <span className="oc-order-id-label">訂單編號</span>
          <span className="oc-order-id-value">{orderId}</span>
        </div>

        <p className="oc-desc">
          感謝您的購買！訂單確認通知將發送至您的 Email。
          <br />
          {/* TODO: [BACKEND] 顯示預計到貨時間（後端回傳後替換） */}
          如有任何問題，歡迎透過客服聯絡我們。
        </p>

        <div className="oc-divider" />

        {order && (
          <div className="oc-info-section">
            <Package
              size={16}
              color="var(--color-gray-dark)"
              className="oc-icon-left"
              aria-hidden="true"
            />
            <span className="oc-info-text">
              {/* TODO: [BACKEND] 顯示商品數量、配送方式等（依後端回傳欄位調整） */}
              訂單資料已接收，正在處理中
            </span>
          </div>
        )}

        <div className="oc-btn-row">
          <Link to={ROUTES.ORDER_QUERY} className="oc-btn btn-blue">
            查看訂單進度 <ArrowRight size={16} className="oc-icon-right" aria-hidden="true" />
          </Link>
          <Link to={ROUTES.PRODUCTS} className="oc-btn oc-btn-outline">
            <RotateCcw size={14} className="oc-icon-left" aria-hidden="true" /> 繼續購物
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirm
