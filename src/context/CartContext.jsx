import React, { createContext, useCallback, useEffect, useState } from 'react'

import { CONFIG } from '../constants/config'
import analytics from '../utils/analytics'
import { cartStorage } from '../utils/storage'
import { useToast } from './ToastContext'

const CartContext = createContext(null)

const clampCartQuantity = (quantity) => {
  const normalizedQuantity = Number(quantity)

  if (Number.isNaN(normalizedQuantity) || normalizedQuantity < 1) return 1

  return Math.min(normalizedQuantity, CONFIG.MAX_CART_QUANTITY)
}

const normalizeCartItems = (items) => {
  if (!Array.isArray(items)) return []

  return items.map((item) => ({
    ...item,
    quantity: clampCartQuantity(item?.quantity),
  }))
}

const EMPTY_POINT_REDEMPTION = {
  requestedPoints: 0,
  availablePoints: 0,
  maxRedeemablePoints: 0,
  redeemablePoints: 0,
  redemptionAmount: 0,
  orderSubtotal: 0,
  remainingAmount: 0,
  isValid: true,
  validationMessage: null,
}

export const CartProvider = ({ children }) => {
  const toast = useToast()
  const [cartItems, setCartItems] = useState(() => cartStorage.getItems())
  const [isCartLoading] = useState(false)
  const [cartError, setCartError] = useState(null)
  const [pointRedemption, setPointRedemptionState] = useState(
    EMPTY_POINT_REDEMPTION
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      cartStorage.setItems(cartItems)
    }, 300)
    return () => clearTimeout(timer)
  }, [cartItems])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleStorage = (event) => {
      try {
        if (event.key !== CONFIG.CART_STORAGE_KEY) return
        setCartItems(normalizeCartItems(cartStorage.getItems()))
      } catch {
        // fail silently
      }
    }

    try {
      window.addEventListener('storage', handleStorage)
    } catch {
      // fail silently
    }

    return () => {
      try {
        window.removeEventListener('storage', handleStorage)
      } catch {
        // fail silently
      }
    }
  }, [])

  const addToCart = useCallback((item) => {
    const quantityToAdd = clampCartQuantity(item.quantity)

    setCartError(null)

    setCartItems((prev) => {
      const normalizedPrev = normalizeCartItems(prev)
      const exists = normalizedPrev.find((cartItem) => cartItem.id === item.id)

      if (exists) {
        return normalizedPrev.map((cartItem) => (
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: clampCartQuantity(Number(cartItem.quantity) + quantityToAdd),
              }
            : cartItem
        ))
      }

      return [...normalizedPrev, { ...item, quantity: quantityToAdd }]
    })
    toast.success('已加入購物車 🐾')

    analytics.addToCart(item, quantityToAdd)
  }, [toast])

  const removeFromCart = useCallback((id) => {
    const item = cartItems.find((cartItem) => cartItem.id === id)
    setCartError(null)
    setCartItems((prev) => normalizeCartItems(prev).filter((i) => i.id !== id))
    toast.info('已從購物車移除')

    analytics.removeFromCart(item, item?.quantity ?? 1)
  }, [cartItems, toast])

  const updateQuantity = useCallback((id, quantity) => {
    setCartError(null)
    setCartItems((prev) => (
      normalizeCartItems(prev).map((item) => (
        item.id === id ? { ...item, quantity: clampCartQuantity(quantity) } : item
      ))
    ))
  }, [])

  const clearCart = useCallback(() => {
    setCartError(null)
    setCartItems([])
    setPointRedemptionState(EMPTY_POINT_REDEMPTION)
    cartStorage.clear()
  }, [])

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  )
  const itemCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)

  useEffect(() => {
    setPointRedemptionState((prev) => (
      prev.requestedPoints > 0 && prev.orderSubtotal !== subtotal
        ? EMPTY_POINT_REDEMPTION
        : prev
    ))
  }, [subtotal])

  const setPointRedemption = useCallback((nextRedemption) => {
    setPointRedemptionState({
      ...EMPTY_POINT_REDEMPTION,
      ...(nextRedemption ?? {}),
    })
  }, [])

  const clearPointRedemption = useCallback(() => {
    setPointRedemptionState(EMPTY_POINT_REDEMPTION)
  }, [])

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
        pointRedemption,
        setPointRedemption,
        clearPointRedemption,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export { CartContext }
