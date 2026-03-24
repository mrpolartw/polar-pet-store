import React, { createContext, useState, useEffect, useCallback } from 'react'

import cartService from '../services/cartService'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [isCartLoading, setIsCartLoading] = useState(false)
  const [cartError, setCartError] = useState(null)

  useEffect(() => {
    const loadCart = async () => {
      setIsCartLoading(true)
      setCartError(null)

      try {
        // TODO: [BACKEND] cartService.getCart() 需後端 GET /store/carts/:id 實作
        // 後端實作後，回傳格式預期為 { cart: { items: [...] } }
        const data = await cartService.getCart()
        setCartItems(data?.cart?.items ?? data?.items ?? [])
      } catch (err) {
        // API 尚未實作時，維持空購物車（正常開發期行為）
        setCartItems([])
        setCartError(err?.message ?? null)

        if (import.meta.env.DEV) {
          console.warn('[Cart] getCart failed (後端尚未實作，購物車為空)')
        }
      } finally {
        setIsCartLoading(false)
      }
    }

    loadCart()
  }, [])

  const addToCart = useCallback(async (item) => {
    const quantityToAdd = Number(item.quantity) > 0 ? Number(item.quantity) : 1

    setCartError(null)

    setCartItems(prev => {
      const exists = prev.find(i => i.id === item.id)

      if (exists) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
        )
      }

      return [...prev, { ...item, quantity: quantityToAdd }]
    })

    try {
      // TODO: [BACKEND] 後端實作後，改為呼叫 API 並用回傳結果更新 cartItems
      // await cartService.addItem(item.variantId, quantityToAdd)
      // const data = await cartService.getCart()
      // setCartItems(data?.cart?.items ?? [])
    } catch (err) {
      setCartError(err?.message ?? null)

      if (import.meta.env.DEV) {
        console.warn('[Cart] addItem API 尚未實作，使用本地狀態')
      }
    }
  }, [])

  const removeFromCart = useCallback(async (id) => {
    setCartError(null)
    setCartItems(prev => prev.filter(i => i.id !== id))

    try {
      // TODO: [BACKEND] await cartService.removeItem(id)
    } catch (err) {
      setCartError(err?.message ?? null)

      if (import.meta.env.DEV) {
        console.warn('[Cart] removeItem API 尚未實作，使用本地狀態')
      }
    }
  }, [])

  const updateQuantity = useCallback(async (id, quantity) => {
    setCartError(null)
    setCartItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity: Number(quantity) } : i))
    )

    try {
      // TODO: [BACKEND] await cartService.updateItem(id, quantity)
    } catch (err) {
      setCartError(err?.message ?? null)

      if (import.meta.env.DEV) {
        console.warn('[Cart] updateItem API 尚未實作，使用本地狀態')
      }
    }
  }, [])

  const clearCart = useCallback(async () => {
    setCartError(null)
    setCartItems([])
    // TODO: [BACKEND] 後端實作後逐一呼叫 cartService.removeItem() 或清空 cart
  }, [])

  // TODO: [BACKEND] subtotal 應由後端計算並回傳，前端僅作顯示用途
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  )
  const itemCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartLoading,
        cartError,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export { CartContext }
