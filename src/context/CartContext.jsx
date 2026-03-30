import React, { createContext, useEffect, useState } from 'react'

import { getStoreRegion } from '../api/products'
import { sdk } from '../lib/medusa'
import { useAuth } from './useAuth'

const CartContext = createContext(null)
const GUEST_CART_KEY = 'polar_cart_id'

function toPositiveInteger(value, fallback = 1) {
  const nextValue = Number(value)

  if (Number.isFinite(nextValue) && nextValue > 0) {
    return Math.floor(nextValue)
  }

  return fallback
}

function mapLineItems(items = []) {
  return items.map((item) => ({
    id: item.id,
    variantId: item.variant_id,
    productId: item.product_id,
    name: item.title,
    specs: item.variant_title || '',
    price: Number(item.unit_price || 0),
    quantity: Number(item.quantity || 0),
    image: item.thumbnail || '',
    shippingMethods: ['宅配到府', '7-ELEVEN 超商取貨'],
  }))
}

export const CartProvider = ({ children }) => {
  const { user } = useAuth()

  const [cartId, setCartId] = useState(() => localStorage.getItem(GUEST_CART_KEY))
  const [cartItems, setCartItems] = useState([])
  const [medusaCart, setMedusaCart] = useState(null)
  const [isCartLoading, setIsCartLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadCart = async () => {
      if (!cartId) {
        setCartItems([])
        setMedusaCart(null)
        setIsCartLoading(false)
        return
      }

      setIsCartLoading(true)

      try {
        const { cart } = await sdk.store.cart.retrieve(cartId, {
          fields: '*items,*items.variant,*items.variant.product,*shipping_methods',
        })

        if (!isMounted) return

        setMedusaCart(cart)
        setCartItems(mapLineItems(cart.items))
      } catch (error) {
        console.error('Failed to load cart:', error)

        if (!isMounted) return

        localStorage.removeItem(GUEST_CART_KEY)
        setCartId(null)
        setCartItems([])
        setMedusaCart(null)
      } finally {
        if (isMounted) {
          setIsCartLoading(false)
        }
      }
    }

    loadCart()

    return () => {
      isMounted = false
    }
  }, [cartId])

  useEffect(() => {
    if (!user?.id || !cartId || !medusaCart || medusaCart.customer_id) {
      return
    }

    let isMounted = true

    const transferCartToCustomer = async () => {
      try {
        const { cart } = await sdk.store.cart.transferCart(cartId)

        if (!isMounted) return

        setMedusaCart(cart)
        setCartItems(mapLineItems(cart.items))
      } catch (error) {
        console.warn('Failed to transfer guest cart to customer:', error)
      }
    }

    transferCartToCustomer()

    return () => {
      isMounted = false
    }
  }, [user?.id, cartId, medusaCart])

  const ensureCart = async () => {
    if (medusaCart?.id) {
      return medusaCart
    }

    const region = await getStoreRegion()
    const { cart } = await sdk.store.cart.create({
      ...(region?.id ? { region_id: region.id } : {}),
    })

    localStorage.setItem(GUEST_CART_KEY, cart.id)
    setCartId(cart.id)
    setMedusaCart(cart)
    setCartItems(mapLineItems(cart.items))

    return cart
  }

  const addLocalItem = (item, quantityToAdd) => {
    setCartItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id)

      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
            : cartItem,
        )
      }

      return [...prev, { ...item, quantity: quantityToAdd }]
    })
  }

  const addToCart = async (item) => {
    const quantityToAdd = toPositiveInteger(item.quantity, 1)

    if (!item.variantId) {
      addLocalItem(item, quantityToAdd)
      return
    }

    try {
      const cart = await ensureCart()
      const { cart: updatedCart } = await sdk.store.cart.createLineItem(cart.id, {
        variant_id: item.variantId,
        quantity: quantityToAdd,
      })

      setMedusaCart(updatedCart)
      setCartItems(mapLineItems(updatedCart.items))
    } catch (error) {
      console.error('addToCart error:', error)
      addLocalItem(item, quantityToAdd)
    }
  }

  const removeFromCart = async (id) => {
    if (!medusaCart?.id) {
      setCartItems((prev) => prev.filter((item) => item.id !== id))
      return
    }

    try {
      const response = await sdk.store.cart.deleteLineItem(medusaCart.id, id)
      const updatedCart = response.parent || response.cart || null

      if (updatedCart) {
        setMedusaCart(updatedCart)
        setCartItems(mapLineItems(updatedCart.items))
        return
      }

      setCartItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error('removeFromCart error:', error)
    }
  }

  const updateQuantity = async (id, quantity) => {
    const nextQuantity = toPositiveInteger(quantity, 0)

    if (nextQuantity < 1) {
      await removeFromCart(id)
      return
    }

    if (!medusaCart?.id) {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item)),
      )
      return
    }

    try {
      const { cart: updatedCart } = await sdk.store.cart.updateLineItem(medusaCart.id, id, {
        quantity: nextQuantity,
      })

      setMedusaCart(updatedCart)
      setCartItems(mapLineItems(updatedCart.items))
    } catch (error) {
      console.error('updateQuantity error:', error)
    }
  }

  const clearCart = () => {
    localStorage.removeItem(GUEST_CART_KEY)
    setCartItems([])
    setMedusaCart(null)
    setCartId(null)
  }

  const subtotal = cartItems.reduce(
    (accumulator, item) => accumulator + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  )

  const itemCount = cartItems.reduce(
    (accumulator, item) => accumulator + Number(item.quantity || 0),
    0,
  )

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
