import React, { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight, RotateCcw } from 'lucide-react'

import { ErrorState, LoadingSpinner } from '../../components/common'
import { ROUTES } from '../../constants/routes'
import orderService from '../../services/orderService'

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
      <div style={styles.page}>
        <div style={styles.card}>
          <LoadingSpinner size="large" label="正在確認訂單資訊⋯" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <ErrorState
            message={error}
            onRetry={() => window.location.reload()}
            retryLabel="重新載入"
          />
          <div style={{ ...styles.btnRow, marginTop: 16 }}>
            <Link to={ROUTES.ORDER_QUERY} className="btn-blue" style={styles.btn}>
              前往訂單查詢
            </Link>
            <Link to={ROUTES.HOME} style={{ ...styles.btn, ...styles.btnOutline }}>
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>
          <CheckCircle2
            size={64}
            color="var(--color-brand-blue)"
            strokeWidth={1.5}
          />
        </div>

        <h1 style={styles.title}>訂單已成立</h1>

        <div style={styles.orderIdBox}>
          <span style={styles.orderIdLabel}>訂單編號</span>
          <span style={styles.orderIdValue}>{orderId}</span>
        </div>

        <p style={styles.desc}>
          感謝您的購買！訂單確認通知將發送至您的 Email。
          <br />
          {/* TODO: [BACKEND] 顯示預計到貨時間（後端回傳後替換） */}
          如有任何問題，歡迎透過客服聯絡我們。
        </p>

        <div style={styles.divider} />

        {order && (
          <div style={styles.infoSection}>
            <Package
              size={16}
              color="var(--color-gray-dark)"
              style={{ marginRight: 6, verticalAlign: 'middle' }}
            />
            <span style={styles.infoText}>
              {/* TODO: [BACKEND] 顯示商品數量、配送方式等（依後端回傳欄位調整） */}
              訂單資料已接收，正在處理中
            </span>
          </div>
        )}

        <div style={styles.btnRow}>
          <Link
            to={ROUTES.ORDER_QUERY}
            className="btn-blue"
            style={styles.btn}
          >
            查看訂單進度
            <ArrowRight size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
          </Link>
          <Link
            to={ROUTES.PRODUCTS}
            style={{ ...styles.btn, ...styles.btnOutline }}
          >
            <RotateCcw size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            繼續購物
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: 'var(--color-bg-light)',
    paddingTop: 80,
  },
  card: {
    background: 'var(--color-bg-white)',
    borderRadius: 'var(--pet-border-radius)',
    boxShadow: '0 10px 40px var(--color-shadow-light)',
    border: '1px solid var(--color-gray-light)',
    padding: '56px 48px',
    maxWidth: 520,
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 24,
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'var(--color-bg-light)',
    border: '2px solid var(--color-gray-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--color-text-dark)',
    marginBottom: 16,
    letterSpacing: '-0.02em',
  },
  orderIdBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    background: 'var(--color-bg-light)',
    border: '1px solid var(--color-gray-light)',
    borderRadius: 10,
    padding: '12px 32px',
    marginBottom: 20,
  },
  orderIdLabel: {
    fontSize: 11,
    color: 'var(--color-gray-dark)',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  orderIdValue: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--color-brand-blue)',
    letterSpacing: '0.06em',
  },
  desc: {
    fontSize: 15,
    color: 'var(--color-gray-dark)',
    lineHeight: 1.7,
    marginBottom: 24,
    maxWidth: 360,
  },
  divider: {
    width: '100%',
    height: 1,
    background: 'var(--color-gray-light)',
    marginBottom: 20,
  },
  infoSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  infoText: {
    fontSize: 13,
    color: 'var(--color-gray-dark)',
    verticalAlign: 'middle',
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  btn: {
    padding: '12px 24px',
    borderRadius: 980,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnOutline: {
    border: '1.5px solid var(--color-gray-light)',
    color: 'var(--color-text-dark)',
    background: 'var(--color-bg-white)',
  },
}

export default OrderConfirm
