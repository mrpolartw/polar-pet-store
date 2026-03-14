import React, { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

// 預設假資料（未來串接後端時替換為 API 呼叫）
const INITIAL_ITEMS = [
  {
    id: 1,
    name: 'Polar 主食罐 - 鮮鮭魚',
    specs: '85g x 24罐',
    price: 1280,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=600',
    gift: '贈品 x2',
    shippingMethods: ['宅配', '7-ELEVEN'],
  },
  {
    id: 2,
    name: 'Polar 益生菌化毛膏',
    specs: '60g',
    price: 850,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=600',
    gift: '贈品 x1',
    shippingMethods: ['宅配', '全家', '7-ELEVEN'],
  },
]

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(INITIAL_ITEMS)

  const addToCart = (item) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id))
  }

  const updateQuantity = (id, quantity) => {
    setCartItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: Number(quantity) } : i)
    )
  }

  const clearCart = () => setCartItems([])

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart 必須在 CartProvider 內使用')
  return context
}
