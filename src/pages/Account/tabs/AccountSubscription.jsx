import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Loader2, PauseCircle, RefreshCw, XCircle } from 'lucide-react'

import { EmptyState } from '../../../components/common'
import { useToast } from '../../../context/ToastContext'
import membershipService from '../../../services/membershipService'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const STATUS_LABELS = {
  active: '啟用中',
  paused: '已暫停',
  canceled: '已取消',
  expired: '已到期',
}

const INTERVAL_LABELS = {
  monthly: '每月',
  yearly: '每年',
  one_time: '單次',
}

function formatDate(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatMoney(value, currencyCode = 'TWD') {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export default function AccountSubscription() {
  const toast = useToast()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  const loadSubscriptions = useCallback(
    async (activeRef = { current: true }) => {
      setLoading(true)
      setError('')

      try {
        const response = await membershipService.getCustomerSubscriptions()
        if (!activeRef.current) return
        setSubscriptions(response.items)
      } catch (err) {
        if (!activeRef.current) return
        const message = err?.message || '訂閱資料載入失敗，請稍後再試。'
        setError(message)
        toast.error(message)
      } finally {
        if (activeRef.current) {
          setLoading(false)
        }
      }
    },
    [toast]
  )

  useEffect(() => {
    const activeRef = { current: true }
    void loadSubscriptions(activeRef)

    return () => {
      activeRef.current = false
    }
  }, [loadSubscriptions])

  const activeCount = useMemo(
    () => subscriptions.filter((item) => item.status === 'active').length,
    [subscriptions]
  )

  const handleUpdateStatus = async (subscription, nextStatus) => {
    setUpdatingId(subscription.id)

    try {
      const response = await membershipService.updateCustomerSubscription(subscription.id, {
        status: nextStatus,
      })
      const nextSubscription = response?.subscription

      setSubscriptions((prev) =>
        prev.map((item) => (item.id === nextSubscription.id ? nextSubscription : item))
      )

      toast.success(
        nextStatus === 'paused'
          ? '訂閱已暫停。'
          : nextStatus === 'active'
            ? '訂閱已恢復。'
            : '訂閱狀態已更新。'
      )
    } catch (err) {
      toast.error(err?.message || '更新訂閱狀態失敗，請稍後再試。')
    } finally {
      setUpdatingId('')
    }
  }

  const handleCancel = async (subscription) => {
    if (!window.confirm(`確定要取消「${subscription.plan_name}」嗎？`)) {
      return
    }

    setUpdatingId(subscription.id)

    try {
      const response = await membershipService.cancelCustomerSubscription(subscription.id)
      const nextSubscription = response?.subscription

      setSubscriptions((prev) =>
        prev.map((item) => (item.id === nextSubscription.id ? nextSubscription : item))
      )
      toast.success('訂閱已取消。')
    } catch (err) {
      toast.error(err?.message || '取消訂閱失敗，請稍後再試。')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <motion.div key="subscription" {...fadeUp}>
      <h2 className="account-section-title">
        <RefreshCw size={22} className="account-nav-icon" />
        訂閱服務
      </h2>

      {loading ? (
        <div className="account-empty-state">
          <Loader2 size={28} className="animate-spin" />
          <p style={{ marginTop: 12 }}>訂閱資料載入中...</p>
        </div>
      ) : error ? (
        <EmptyState
          className="account-empty-state"
          icon={<RefreshCw size={36} />}
          title="訂閱資料載入失敗"
          description={error}
          actionLabel="重新載入"
          onAction={() => void loadSubscriptions()}
        />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          className="account-empty-state"
          icon={<RefreshCw size={36} />}
          title="目前沒有訂閱服務"
          description="當你加入訂閱方案後，這裡會顯示方案名稱、狀態與下次扣款資訊。"
        />
      ) : (
        <>
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
                目前共有 <strong>{activeCount}</strong> 筆啟用中的訂閱。
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#6e6e73', fontSize: 13 }}>
                你可以在這裡查看下次扣款日、到期日，以及暫停或取消訂閱。
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {subscriptions.map((sub) => {
              const isUpdating = updatingId === sub.id
              const isActive = sub.status === 'active'
              const canResume = sub.status === 'paused'

              return (
                <div
                  key={sub.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--color-gray-light)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: 'var(--color-text-dark)',
                        }}
                      >
                        {sub.plan_name}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: '#6e6e73' }}>
                        {STATUS_LABELS[sub.status] ?? sub.status} ・{' '}
                        {INTERVAL_LABELS[sub.billing_interval] ?? '未設定週期'}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--color-brand-coffee)',
                      }}
                    >
                      {formatMoney(sub.amount, sub.currency_code)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: '#6e6e73' }}>開始日期</div>
                      <div style={{ marginTop: 4, fontWeight: 600 }}>
                        {formatDate(sub.started_at)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6e6e73' }}>到期日</div>
                      <div style={{ marginTop: 4, fontWeight: 600 }}>
                        {formatDate(sub.expires_at)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6e6e73' }}>下次扣款日</div>
                      <div style={{ marginTop: 4, fontWeight: 600 }}>
                        {formatDate(sub.next_billing_at)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#6e6e73' }}>幣別</div>
                      <div style={{ marginTop: 4, fontWeight: 600 }}>
                        {sub.currency_code || 'TWD'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {isActive ? (
                      <button
                        type="button"
                        className="btn-address-action"
                        onClick={() => handleUpdateStatus(sub, 'paused')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <PauseCircle size={14} />
                        )}{' '}
                        暫停訂閱
                      </button>
                    ) : null}

                    {canResume ? (
                      <button
                        type="button"
                        className="btn-address-action"
                        onClick={() => handleUpdateStatus(sub, 'active')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Calendar size={14} />
                        )}{' '}
                        恢復訂閱
                      </button>
                    ) : null}

                    {sub.status !== 'canceled' ? (
                      <button
                        type="button"
                        className="btn-address-action"
                        onClick={() => handleCancel(sub)}
                        disabled={isUpdating}
                        style={{ color: '#d14343' }}
                      >
                        {isUpdating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}{' '}
                        取消訂閱
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </motion.div>
  )
}
