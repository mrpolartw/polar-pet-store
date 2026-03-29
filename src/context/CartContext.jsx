import React, { createContext, useState, useEffect } from 'react'
import { sdk } from '../lib/medusa'
import { useAuth } from './useAuth'

const CartContext = createContext(null)

// 購物車 localStorage key（未登入的訪客使用）
const GUEST_CART_KEY = 'polar_cart_id'

export const CartProvider = ({ children }) => {
  useAuth()

  const [cartId, setCartId] = useState(() => localStorage.getItem(GUEST_CART_KEY))
  const [cartItems, setCartItems] = useState([])
  const [medusaCart, setMedusaCart] = useState(null)
  const [isCartLoading, setIsCartLoading] = useState(false)

  // ──────────────────────────────────────────────
  // 格式轉換：把 Medusa 購物車 Line Item → 前台格式
  // ──────────────────────────────────────────────
  const mapLineItems = (items = []) =>
    items.map(item => ({
      id: item.id,
      variantId: item.variant_id,
      productId: item.product_id,
      name: item.title,
      specs: item.variant_title || '',
      price: (item.unit_price || 0),
      quantity: item.quantity,
      image: item.thumbnail || '',
      shippingMethods: ['宅配', '超商取貨'],
    }))

  // ──────────────────────────────────────────────
  // 初始化：載入購物車
  // ──────────────────────────────────────────────
  useEffect(() => {
    const initCart = async () => {
      setIsCartLoading(true)
      try {
        if (cartId) {
          // 嘗試從 Medusa 載入現有的購物車
          const { cart } = await sdk.store.cart.retrieve(cartId)
          if (cart) {
            setMedusaCart(cart)
            setCartItems(mapLineItems(cart.items))
            return
          }
        }
        // 如果沒有 cartId 或購物車不存在，先留空
        setCartItems([])
      } catch (err) {
        console.error('Failed to load cart:', err)
        // 購物車 ID 可能失效，清除它
        localStorage.removeItem(GUEST_CART_KEY)
        setCartId(null)
        setCartItems([])
      } finally {
        setIsCartLoading(false)
      }
    }
    initCart()
  }, [cartId])

  // ──────────────────────────────────────────────
  // 確保購物車存在（不存在則建立新的）
  // ──────────────────────────────────────────────
  const ensureCart = async () => {
    if (medusaCart) return medusaCart

    let region_id = undefined;
    try {
      const { regions } = await sdk.store.region.list({ limit: 1 });
      if (regions?.length > 0) region_id = regions[0].id;
    } catch(e) { console.warn('Failed to fetch regions', e); }

    const { cart } = await sdk.store.cart.create({ region_id })
    localStorage.setItem(GUEST_CART_KEY, cart.id)
    setCartId(cart.id)
    setMedusaCart(cart)
    return cart
  }

  // ──────────────────────────────────────────────
  // 加入購物車
  // ──────────────────────────────────────────────
  const addToCart = async (item) => {
    // 如果沒有 variantId，降級為本地購物車（後台尚未建立商品時）
    if (!item.variantId) {
      setCartItems(prev => {
        const exists = prev.find(i => i.id === item.id)
        if (exists) {
          return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        }
        return [...prev, { ...item, quantity: 1 }]
      })
      return
    }

    // 與 Medusa 同步
    try {
      const cart = await ensureCart()
      const { cart: updatedCart } = await sdk.store.cart.createLineItem(cart.id, {
        variant_id: item.variantId,
        quantity: 1,
      })
      setMedusaCart(updatedCart)
      setCartItems(mapLineItems(updatedCart.items))
    } catch (err) {
      console.error('addToCart error:', err)
      // 失敗時降級為本地狀態
      setCartItems(prev => {
        const exists = prev.find(i => i.id === item.id)
        if (exists) {
          return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        }
        return [...prev, { ...item, quantity: 1 }]
      })
    }
  }

  // ──────────────────────────────────────────────
  // 移除購物車項目
  // ──────────────────────────────────────────────
  const removeFromCart = async (id) => {
    const item = cartItems.find(i => i.id === id)

    // 先樂觀更新 UI
    setCartItems(prev => prev.filter(i => i.id !== id))

    if (medusaCart && item) {
      try {
        const { cart: updatedCart } = await sdk.store.cart.deleteLineItem(medusaCart.id, id)
        setMedusaCart(updatedCart)
        setCartItems(mapLineItems(updatedCart.items))
      } catch (err) {
        console.error('removeFromCart error:', err)
      }
    }
  }

  // ──────────────────────────────────────────────
  // 更新購物車數量
  // ──────────────────────────────────────────────
  const updateQuantity = async (id, quantity) => {
    const qty = Number(quantity)
    if (qty < 1) { removeFromCart(id); return }

    // 先樂觀更新 UI
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))

    if (medusaCart) {
      try {
        const { cart: updatedCart } = await sdk.store.cart.updateLineItem(medusaCart.id, id, {
          quantity: qty,
        })
        setMedusaCart(updatedCart)
        setCartItems(mapLineItems(updatedCart.items))
      } catch (err) {
        console.error('updateQuantity error:', err)
      }
    }
  }

  // ──────────────────────────────────────────────
  // 清空購物車
  // ──────────────────────────────────────────────
  const clearCart = () => {
    setCartItems([])
    setMedusaCart(null)
    setCartId(null)
    localStorage.removeItem(GUEST_CART_KEY)
  }

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  )
  const itemCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        medusaCart,
        cartId,
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
