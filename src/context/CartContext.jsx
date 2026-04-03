import React, { createContext, useState } from 'react'

const CartContext = createContext(null)

// TODO: 遷移至 WooCommerce Cart API（WooCommerce Blocks Store API）
// 目前使用純本地狀態，不與後端同步。

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [isCartLoading] = useState(false)

  // ──────────────────────────────────────────────
  // 加入購物車（本地狀態）
  // ──────────────────────────────────────────────
  const addToCart = (item) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }]
    })
  }

  // ──────────────────────────────────────────────
  // 移除購物車項目
  // ──────────────────────────────────────────────
  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id))
  }

  // ──────────────────────────────────────────────
  // 更新購物車數量
  // ──────────────────────────────────────────────
  const updateQuantity = (id, quantity) => {
    const qty = Number(quantity)
    if (qty < 1) { removeFromCart(id); return }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  // ──────────────────────────────────────────────
  // 清空購物車
  // ──────────────────────────────────────────────
  const clearCart = () => {
    setCartItems([])
  }

  const ensureCart = async () => ({})

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  )
  const itemCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        medusaCart: null,
        cartId: null,
        isCartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        ensureCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export { CartContext }
