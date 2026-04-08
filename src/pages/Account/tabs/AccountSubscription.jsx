import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  RefreshCw, Package, Calendar, XCircle, PauseCircle,
  CheckCircle, Clock, X,
} from 'lucide-react'
import { EmptyState } from '../../../components/common'
import ROUTES from '../../../constants/routes'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

// Mock 月訂資料 — TODO BACKEND: subscriptionService.getSubscriptions()
const MOCK_SUBSCRIPTIONS = [
  {
    id: 'sub-001',
    orderId: 'PL-20260023',
    productName: 'Polar 腸胃保健狗糧 2.5kg',
    productImage: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300',
    specs: '2.5kg',
    quantity: 1,
    frequency: '每月',
    nextPayment: '2026-04-15',
    price: 1380,
    status: 'active',
    discount: 0.9,
  },
  {
    id: 'sub-002',
    orderId: 'PL-20260045',
    productName: 'Polar 關節軟骨咀嚼錠 60顆',
    productImage: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=300',
    specs: '60顆',
    quantity: 2,
    frequency: '每周',
    nextPayment: '2026-03-30',
    price: 1290,
    status: 'paused',
    discount: 0.9,
  },
]

const STATUS_CONFIG = {
  active: { label: '訂閱中', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle },
  paused: { label: '已暫停', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: PauseCircle },
  cancelled: { label: '已取消', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle },
}

function CancelSubscriptionModal({
  show,
  subscription,
  cancelInput,
  setCancelInput,
  isSubmitting,
  onClose,
  onConfirm,
}) {
  const canConfirm = cancelInput === '取消' && !isSubmitting

  return (
    <AnimatePresence>
      {show && subscription && (
        <>
          <motion.div
            className="address-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isSubmitting) onClose()
            }}
          />

          <div className="address-modal-wrapper">
            <motion.div
              className="address-modal"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="address-modal-header">
                <h3 className="address-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={18} color="#DC2626" />
                  取消訂閱
                </h3>
                <button className="address-modal-close" onClick={onClose} disabled={isSubmitting}>
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 16,
                  padding: '16px 18px',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#B91C1C', marginBottom: 8 }}>
                  此操作無法復原
                </div>
                <div style={{ fontSize: 14, color: '#991B1B', lineHeight: 1.7 }}>
                  取消後將立即停止 <strong>{subscription.productName}</strong> 的後續扣款與出貨安排。
                </div>
              </div>

              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 16,
                  padding: '16px 18px',
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#B45309', marginBottom: 8 }}>
                  注意事項
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.7 }}>
                    1. 取消訂閱後內容無法恢復，若要再次訂閱需重新建立方案。
                  </div>
                  <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.7 }}>
                    2. 延期功能每個訂閱方案僅限使用一次。
                  </div>
                </div>
              </div>

              <div className="address-form" style={{ gap: 10 }}>
                <div>
                  <label className="address-form-label">請輸入「取消」以確認</label>
                  <input
                    type="text"
                    className="apple-input"
                    value={cancelInput}
                    onChange={(event) => setCancelInput(event.target.value)}
                    placeholder="輸入「取消」"
                    disabled={isSubmitting}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#6e6e73', lineHeight: 1.6 }}>
                  只有在輸入完全正確的「取消」後，才可執行確認。
                </div>
              </div>

              <div className="address-modal-actions">
                <button className="btn-modal-cancel" onClick={onClose} disabled={isSubmitting}>
                  返回
                </button>
                <button
                  className="btn-modal-submit"
                  onClick={onConfirm}
                  disabled={!canConfirm}
                  style={{
                    background: canConfirm ? '#DC2626' : '#E5E7EB',
                    color: canConfirm ? '#FFFFFF' : '#6B7280',
                    border: 'none',
                    cursor: canConfirm ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isSubmitting ? '處理中...' : '確定取消訂閱'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function AccountSubscription() {
  const [subscriptions, setSubscriptions] = useState(MOCK_SUBSCRIPTIONS)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelInput, setCancelInput] = useState('')
  const [isDelaying, setIsDelaying] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const calculateDelayDate = (frequency, currentDate) => {
    const date = new Date(currentDate)
    if (frequency === '每周') {
      date.setDate(date.getDate() + 7)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    return date.toISOString().slice(0, 10)
  }

  const openCancelModal = (subscription) => {
    setCancelModal(subscription)
    setCancelInput('')
  }

  const closeCancelModal = () => {
    if (isCancelling) return
    setCancelModal(null)
    setCancelInput('')
  }

  const handleConfirmCancel = async () => {
    if (!cancelModal || cancelInput !== '取消') return

    setIsCancelling(true)
    await new Promise((resolve) => setTimeout(resolve, 300))

    setSubscriptions((prev) =>
      prev.map((item) => (
        item.id === cancelModal.id ? { ...item, status: 'cancelled' } : item
      ))
    )

    setIsCancelling(false)
    closeCancelModal()
  }

  const handleDelay = async (id) => {
    setIsDelaying(id)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const current = subscriptions.find((item) => item.id === id)
    const delayDate = calculateDelayDate(current?.frequency, current?.nextPayment)

    setSubscriptions((prev) =>
      prev.map((item) => (
        item.id === id
          ? {
              ...item,
              nextPayment: delayDate,
              delayUsed: true,
              delayedAt: new Date().toISOString().slice(0, 10),
            }
          : item
      ))
    )
    setIsDelaying(null)
  }

  const activeCount = subscriptions.filter((item) => item.status === 'active').length
  const activeDates = subscriptions
    .filter((item) => item.status === 'active')
    .map((item) => new Date(item.nextPayment).getTime())
  const nextActivePaymentLabel = activeDates.length > 0
    ? new Date(Math.min(...activeDates)).toLocaleDateString('zh-TW')
    : null

  return (
    <motion.div key="subscription" {...fadeUp}>
      <CancelSubscriptionModal
        show={!!cancelModal}
        subscription={cancelModal}
        cancelInput={cancelInput}
        setCancelInput={setCancelInput}
        isSubmitting={isCancelling}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
      />

      <h2 className="account-section-title">
        <RefreshCw size={22} className="account-nav-icon" />
        訂閱專區
      </h2>

      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 14,
        }}
      >
        <RefreshCw size={18} color="#003153" style={{ flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: '#1d1d1f' }}>
            目前有 <strong>{activeCount}</strong> 個訂閱中的商品
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#6e6e73', fontSize: 13 }}>
            訂閱享 9 折優惠，
            {activeCount > 0
              ? `下次扣款日最快為 ${nextActivePaymentLabel}`
              : '每月自動出貨，隨時可延期/取消'}
          </p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          className="account-empty-state"
          icon={<RefreshCw size={36} />}
          title="尚無訂閱商品"
          description="訂閱您常用的商品，享 9 折優惠並免除每月重複下單的麻煩"
          action={(
            <Link
              to={ROUTES.PRODUCTS}
              className="btn-blue"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                borderRadius: 980,
                textDecoration: 'none',
                fontSize: 15,
              }}
            >
              瀏覽商品
            </Link>
          )}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subscriptions.map((sub) => {
            const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.active
            const Icon = statusCfg.icon
            const hasDelayed = sub.delayUsed ?? false

            return (
              <div
                key={sub.id}
                style={{
                  background: '#fff',
                  border: `2px solid ${statusCfg.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  opacity: sub.status === 'cancelled' ? 0.6 : 1,
                }}
              >
                <img
                  src={sub.productImage}
                  alt={sub.productName}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid var(--color-gray-light)',
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: 4 }}>
                        {sub.productName}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 13, color: 'var(--color-gray-dark)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Package size={12} /> {sub.specs}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> 數量：{sub.quantity}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {sub.frequency}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 6,
                          color: statusCfg.color,
                          background: statusCfg.bg,
                        }}
                      >
                        {statusCfg.label}
                      </span>
                      <Icon size={14} color={statusCfg.color} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      marginBottom: 16,
                      fontSize: 14,
                    }}
                  >
                    <Calendar size={16} color="#64748b" />
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                      訂閱編號：{sub.orderId}
                    </span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontWeight: 600, color: '#1d1d1f' }}>
                      下次扣款：{sub.nextPayment}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--color-brand-coffee)',
                      marginBottom: 16,
                    }}
                  >
                    NT{(sub.price * sub.quantity * sub.discount).toLocaleString()}
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--color-gray-dark)',
                        fontWeight: 400,
                        marginLeft: 8,
                      }}
                    >
                      / {sub.frequency} (享 {sub.discount * 100}折)
                    </span>
                  </div>

                  {sub.status !== 'cancelled' && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      {!hasDelayed && sub.status === 'active' && (
                        <button
                          onClick={() => handleDelay(sub.id)}
                          disabled={isDelaying === sub.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 18px',
                            borderRadius: 980,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                            opacity: isDelaying === sub.id ? 0.6 : 1,
                          }}
                        >
                          {isDelaying === sub.id ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              處理中...
                            </>
                          ) : (
                            <>
                              <Clock size={14} />
                              延期一次
                            </>
                          )}
                        </button>
                      )}

                      {hasDelayed && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          於{sub.delayedAt?.replace(/-/g, '/') ?? ''}延期
                        </span>
                      )}

                      <button
                        onClick={() => openCancelModal(sub)}
                        disabled={isDelaying === sub.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '9px 16px',
                          borderRadius: 980,
                          fontSize: 14,
                          fontWeight: 500,
                          border: '2px solid #e5e7eb',
                          background: 'transparent',
                          color: '#6b7280',
                          cursor: isDelaying === sub.id ? 'not-allowed' : 'pointer',
                          opacity: isDelaying === sub.id ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={14} />
                        取消訂閱
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {import.meta.env.DEV && (
        <div
          style={{
            marginTop: 32,
            padding: '12px 16px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 10,
            fontSize: 12,
            color: '#9a3412',
            textAlign: 'center',
          }}
        >
          ⚠️ Mock 資料｜TODO BACKEND: GET /store/subscriptions
        </div>
      )}
    </motion.div>
  )
}
