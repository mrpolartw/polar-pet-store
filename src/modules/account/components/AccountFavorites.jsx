import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Trash2 } from 'lucide-react'
import { EmptyState } from '../../../components/common'
import { ROUTES } from '../../../constants/routes'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

const MOCK_FAVORITES = [
  {
    id: 1,
    name: 'Polar 凍乾主食 - 雞肉配方',
    price: 1280,
    img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 2,
    name: 'Polar 腸道保健點心',
    price: 850,
    img: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 3,
    name: 'Polar 關節機能零食 - 魚肉',
    price: 460,
    img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300',
  },
]

export default function AccountFavorites() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES)

  return (
    <motion.div key="favorites" {...fadeUp}>
      <h2 className="account-section-title">
        <Heart size={22} className="account-nav-icon" />
        收藏商品
      </h2>

      {favorites.length === 0 ? (
        <EmptyState
          className="account-empty-state"
          icon="🐾"
          title="目前沒有收藏商品"
          description="先去逛逛，把喜歡的商品收藏起來吧。"
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
              前往選購
            </Link>
          )}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 20,
          }}
        >
          {favorites.map((item) => (
            <div
              key={item.id}
              style={{
                borderRadius: 16,
                border: '1px solid var(--color-gray-light)',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px var(--color-shadow-light)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={item.img}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                />
                <button
                  onClick={() => setFavorites((prev) => prev.filter((favorite) => favorite.id !== item.id))}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e74c3c',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ padding: '12px 14px' }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text-dark)',
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--color-brand-coffee)',
                  }}
                >
                  NT${item.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
