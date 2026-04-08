import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { LoadingSpinner, EmptyState, ErrorState } from '../../../components/common'
import { ROUTES } from '../../../constants/routes'
import { useToast } from '../../../context/ToastContext'
import orderService from '../../../services/orderService'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const normalizeOrderStatus = (status) => {
  if (status === 'shipped') return 'shipping'
  return status || 'processing'
}

const getOrderStatusLabel = (status) => {
  switch (status) {
    case 'delivered':
      return '已送達'
    case 'shipping':
    case 'shipped':
      return '配送中'
    case 'cancelled':
      return '已取消'
    case 'processing':
    default:
      return '處理中'
  }
}

const normalizeAccountOrder = (order) => {
  const normalizedStatus = normalizeOrderStatus(order?.status)

  return {
    id: order?.id ?? '',
    date: String(order?.createdAt ?? order?.date ?? '').slice(0, 10),
    status: normalizedStatus,
    statusLabel: getOrderStatusLabel(normalizedStatus),
    total: Number(order?.total ?? 0),
    items: Array.isArray(order?.items)
      ? order.items.map((item, index) => ({
          id: item?.id ?? item?.variantId ?? `item-${index}`,
          name: item?.name ?? '商品',
          img: item?.img ?? item?.image ?? '',
        }))
      : [],
  }
}

const StatusIcon = ({ status }) => ({
  delivered: <CheckCircle size={12} />,
  processing: <Package size={12} />,
  shipping: <Truck size={12} />,
  cancelled: <XCircle size={12} />,
}[status] || null)

export default function AccountOrders() {
  const navigate = useNavigate()
  const toast = useToast()

  const [orders, setOrders] = useState([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)

  const fetchOrders = useCallback(async () => {
    setIsOrdersLoading(true)
    setOrdersError(null)

    try {
      const data = await orderService.getOrders()
      setOrders((data?.orders ?? []).map(normalizeAccountOrder))
    } catch (err) {
      const message = err?.message || '無法取得訂單資料'
      setOrdersError(message)
      toast.error(message)
    } finally {
      setIsOrdersLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <motion.div key="orders" {...fadeUp}>
      <h2 className="account-section-title">
        <ShoppingBag size={22} className="account-nav-icon" />
        我的訂單
      </h2>

      <div className="order-list">
        {isOrdersLoading && (
          <LoadingSpinner size="medium" label="正在載入訂單資料..." />
        )}

        {ordersError && !isOrdersLoading && (
          <ErrorState
            message={ordersError}
            onRetry={fetchOrders}
          />
        )}

        {!isOrdersLoading && !ordersError && orders.length === 0 && (
          <EmptyState
            icon="📦"
            title="尚無訂單紀錄"
            description="先去挑選喜歡的商品，完成第一筆下單吧。"
            actionLabel="前往購物"
            onAction={() => navigate(ROUTES.PRODUCTS)}
          />
        )}

        {!isOrdersLoading && !ordersError && orders.length > 0 && orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-card-header">
              <div>
                <div className="order-id">訂單 {order.id}</div>
                <div className="order-date">{order.date}</div>
              </div>
              <span className={`order-status-badge ${order.status}`}>
                <StatusIcon status={order.status} />
                {order.statusLabel}
              </span>
            </div>

            <div className="order-card-body">
              <div className="order-items-preview">
                {order.items.map((item, index) => (
                  <img
                    key={item.id || index}
                    src={item.img}
                    alt={item.name}
                    className="order-item-img"
                  />
                ))}
              </div>

              <div className="order-info">
                <div className="order-total">NT${order.total.toLocaleString()}</div>
                <div className="order-item-count">{order.items.length} 項商品</div>
              </div>

              <div className="order-actions">
                <button className="btn-order-action">查看明細</button>
                {order.status === 'delivered' && (
                  <button className="btn-order-action primary">再次購買</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
