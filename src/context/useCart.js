import { useContext } from 'react'
import { CartContext } from './CartContext'

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart 必須在 CartProvider 內使用')
  return context
}
