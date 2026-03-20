/**
 * 購物車 Context
 * 負責同步 Medusa cart 與前端購物車狀態，並保留既有頁面的相容介面
 */

import React, { createContext, useEffect, useState } from 'react'
import {
  addLineItem,
  applyPromoCode as applyPromoCodeApi,
  deleteLineItem,
  getOrCreateCart,
  removePromoCode as removePromoCodeApi,
  updateLineItem,
} from '../api/cart'

const CartContext = createContext(null)

const normalizeMoney = (amount) => (amount || 0) / 100

const normalizeCartItem = (item) => ({
  ...item,
  name: item.title || item.product_title || '',
  specs: item.variant_title || '',
  price: normalizeMoney(item.unit_price),
  image: item.thumbnail || '',
  shippingMethods: [],
  gift: null,
})

const buildLegacyCartItem = (item, quantity = 1) => ({
  id: item.id || Date.now(),
  name: item.name || '',
  specs: item.specs || '',
  price: Number(item.price || 0),
  quantity,
  image: item.image || '',
  gift: item.gift || null,
  shippingMethods: Array.isArray(item.shippingMethods) ? item.shippingMethods : [],
})

const resolveVariantId = (itemOrVariantId) => {
  if (typeof itemOrVariantId === 'string') {
    return itemOrVariantId
  }

  if (!itemOrVariantId || typeof itemOrVariantId !== 'object') {
    return ''
  }

  return (
    itemOrVariantId.variantId ||
    itemOrVariantId.variant_id ||
    itemOrVariantId.variant?.id ||
    itemOrVariantId.variants?.[0]?.id ||
    ''
  )
}

const isLegacyCartItem = (legacyItems, lineItemId) =>
  legacyItems.some((item) => String(item.id) === String(lineItemId))

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [legacyItems, setLegacyItems] = useState([])

  useEffect(() => {
    let mounted = true

    const initializeCart = async () => {
      setIsLoading(true)

      try {
        const nextCart = await getOrCreateCart()

        if (mounted) {
          setCart(nextCart)
        }
      } catch {
        if (mounted) {
          setCart(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeCart()

    return () => {
      mounted = false
    }
  }, [])

  const cartItems =
    legacyItems.length > 0
      ? legacyItems
      : (cart?.items || []).map(normalizeCartItem)

  const subtotal =
    legacyItems.length > 0
      ? legacyItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : normalizeMoney(cart?.subtotal)

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const shippingTotal = legacyItems.length > 0 ? 0 : normalizeMoney(cart?.shipping_total)
  const discountTotal = legacyItems.length > 0 ? 0 : normalizeMoney(cart?.discount_total)
  const total = legacyItems.length > 0 ? subtotal : normalizeMoney(cart?.total)

  const addToCart = async (itemOrVariantId, quantity = 1) => {
    setIsLoading(true)

    try {
      const variantId = resolveVariantId(itemOrVariantId)

      if (variantId) {
        const updatedCart = await addLineItem(variantId, quantity)

        setLegacyItems([])
        setCart(updatedCart)

        return updatedCart
      }

      if (itemOrVariantId && typeof itemOrVariantId === 'object') {
        setLegacyItems((previousItems) => {
          const existingItem = previousItems.find(
            (item) => String(item.id) === String(itemOrVariantId.id)
          )

          if (existingItem) {
            return previousItems.map((item) =>
              String(item.id) === String(itemOrVariantId.id)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          }

          return [...previousItems, buildLegacyCartItem(itemOrVariantId, quantity)]
        })
      }

      return null
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (lineItemId) => {
    setIsLoading(true)

    try {
      if (isLegacyCartItem(legacyItems, lineItemId)) {
        setLegacyItems((previousItems) =>
          previousItems.filter((item) => String(item.id) !== String(lineItemId))
        )

        return null
      }

      const updatedCart = await deleteLineItem(lineItemId)

      setCart(updatedCart)

      return updatedCart
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (lineItemId, quantity) => {
    const nextQuantity = Number(quantity)

    if (nextQuantity < 1) {
      await removeFromCart(lineItemId)
      return
    }

    setIsLoading(true)

    try {
      if (isLegacyCartItem(legacyItems, lineItemId)) {
        setLegacyItems((previousItems) =>
          previousItems.map((item) =>
            String(item.id) === String(lineItemId)
              ? { ...item, quantity: nextQuantity }
              : item
          )
        )

        return null
      }

      const updatedCart = await updateLineItem(lineItemId, nextQuantity)

      setCart(updatedCart)

      return updatedCart
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = () => {
    localStorage.removeItem('polar_cart_id')
    setLegacyItems([])
    setCart(null)
  }

  const applyPromoCode = async (code) => {
    setIsLoading(true)

    try {
      const result = await applyPromoCodeApi(code)

      if (result.success) {
        setLegacyItems([])
        setCart(result.cart)

        return { success: true }
      }

      return {
        success: false,
        message: result.message,
      }
    } catch (error) {
      return {
        success: false,
        message: error?.message || '優惠碼套用失敗',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const removePromoCode = async (code) => {
    setIsLoading(true)

    try {
      const updatedCart = await removePromoCodeApi(code)

      setLegacyItems([])
      setCart(updatedCart)

      return updatedCart
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        cart,
        isLoading,
        shippingTotal,
        discountTotal,
        total,
        applyPromoCode,
        removePromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export { CartContext }
