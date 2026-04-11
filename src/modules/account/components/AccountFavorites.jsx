import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Loader2, Trash2 } from 'lucide-react'

import { EmptyState } from '../../../components/common'
import { ROUTES } from '../../../constants/routes'
import { useToast } from '../../../context/ToastContext'
import membershipService from '../../../services/membershipService'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

function formatPrice(value, currencyCode = 'TWD') {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export default function AccountFavorites() {
  const toast = useToast()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await membershipService.getCustomerFavorites()
        if (!active) return
        setFavorites(response.items)
      } catch (err) {
        if (!active) return
        setError(err?.message || '收藏商品載入失敗，請稍後再試。')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const handleRemove = async (item) => {
    setRemovingId(item.id)

    try {
      await membershipService.removeCustomerFavorite(item.productId)
      setFavorites((prev) => prev.filter((favorite) => favorite.id !== item.id))
      toast.success('已從收藏清單移除商品。')
    } catch (err) {
      toast.error(err?.message || '移除收藏失敗，請稍後再試。')
    } finally {
      setRemovingId('')
    }
  }

  return (
    <motion.div key="favorites" {...fadeUp}>
      <h2 className="account-section-title">
        <Heart size={22} className="account-nav-icon" />
        收藏商品
      </h2>

      {loading ? (
        <div className="account-empty-state">
          <Loader2 size={28} className="animate-spin" />
          <p style={{ marginTop: 12 }}>收藏商品載入中...</p>
        </div>
      ) : error ? (
        <EmptyState
          className="account-empty-state"
          icon="!"
          title="收藏商品載入失敗"
          description={error}
        />
      ) : favorites.length === 0 ? (
        <EmptyState
          className="account-empty-state"
          icon="♡"
          title="目前沒有收藏商品"
          description="將喜歡的商品加入收藏後，就能在這裡快速查看。"
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
              前往商品列表
            </Link>
          )}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          {favorites.map((item) => {
            const linkTo = item.productHandle ? `/products/${item.productHandle}` : ROUTES.PRODUCTS

            return (
              <div
                key={item.id}
                style={{
                  borderRadius: 16,
                  border: '1px solid var(--color-gray-light)',
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <Link to={linkTo} style={{ display: 'block' }}>
                  <img
                    src={item.productImage || 'https://placehold.co/480x480?text=Mr.Polar'}
                    alt={item.productName}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                  />
                </Link>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <Link
                        to={linkTo}
                        style={{
                          color: 'var(--color-text-dark)',
                          fontSize: 15,
                          fontWeight: 700,
                          textDecoration: 'none',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.productName}
                      </Link>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6e6e73' }}>
                        {item.variantName || '預設規格'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      disabled={removingId === item.id}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#d14343',
                        cursor: removingId === item.id ? 'default' : 'pointer',
                      }}
                    >
                      {removingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-brand-coffee)' }}>
                      {formatPrice(item.price, item.currencyCode)}
                    </span>
                    <span style={{ fontSize: 12, color: item.isAvailable ? '#15803d' : '#b45309' }}>
                      {item.isAvailable ? '可購買' : '目前不可販售'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
