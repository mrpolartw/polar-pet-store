import React, { createContext, useCallback, useEffect, useState } from 'react'

import { CONFIG } from '../constants/config'
import cartService from '../services/cartService'
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
  const [isCartLoading, setIsCartLoading] = useState(false)
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

  useEffect(() => {
    const loadCart = async () => {
      setIsCartLoading(true)
      setCartError(null)

      try {
        const storedItems = normalizeCartItems(cartStorage.getItems())

        if (storedItems.length > 0) {
          setCartItems(storedItems)
          return
        }

        const data = await cartService.getCart()
        const nextItems = normalizeCartItems(data?.cart?.items ?? data?.items ?? [])

        setCartItems(nextItems)
      } catch (err) {
        setCartError(err?.message ?? null)

        if (import.meta.env.DEV) {
          console.warn('[Cart] getCart failed (falling back to local storage)')
        }
      } finally {
        setIsCartLoading(false)
      }
    }

    loadCart()
  }, [])

  const addToCart = useCallback(async (item) => {
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

    try {
      // TODO: [BACKEND] await cartService.addItem(item.variantId, quantityToAdd)
    } catch (err) {
      setCartError(err?.message ?? null)

      if (import.meta.env.DEV) {
        console.warn('[Cart] addItem API failed')
      }
    }
  }, [toast])

  const removeFromCart = useCallback(async (id) => {
    const item = cartItems.find((cartItem) => cartItem.id === id)
    setCartError(null)
    setCartItems((prev) => normalizeCartItems(prev).filter((item) => item.id !== id))
    toast.info('已從購物車移除')

    analytics.removeFromCart(item, item?.quantity ?? 1)

    try {
      // TODO: [BACKEND] await cartService.removeItem(id)
    } catch (err) {
      setCartError(err?.message ?? null)

      if (import.meta.env.DEV) {
        console.warn('[Cart] removeItem API failed')
      }
    }
  }, [cartItems, toast])

  const updateQuantity = useCallback(async (id, quantity) => {
    setCartError(null)
    setCartItems((prev) => (
      normalizeCartItems(prev).map((item) => (
        item.id === id ? { ...item, quantity: clampCartQuantity(quantity) } : item
      ))
    ))

    try {
      // TODO: [BACKEND] await cartService.updateItem(id, quantity)
    } catch (err) {
      setCartError(err?.message ?? null)

      if (import.meta.env.DEV) {
        console.warn('[Cart] updateItem API failed')
      }
    }
  }, [])

  const clearCart = useCallback(async () => {
    setCartError(null)
    setCartItems([])
    setPointRedemptionState(EMPTY_POINT_REDEMPTION)
    cartStorage.clear()
    try {
      // TODO BACKEND: await cartService.clearCart()
      await cartService.clearCart?.()
    } catch {
      // 後端清除失敗不阻斷流程
    }
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
