/**
 * 購物車相關 API
 * cart_id 持久化於 localStorage "polar_cart_id"
 */
import { sdk } from "../lib/medusa"

const CART_ID_KEY = "polar_cart_id"

const getCartId = () => localStorage.getItem(CART_ID_KEY)
const setCartId = (id) => localStorage.setItem(CART_ID_KEY, id)

export const clearCartId = () => localStorage.removeItem(CART_ID_KEY)

const getRequiredCartId = () => {
  const cartId = getCartId()

  if (!cartId) {
    throw new Error("購物車不存在，請重新加入商品")
  }

  return cartId
}

export const getOrCreateCart = async () => {
  const cartId = getCartId()

  if (cartId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(cartId)
      return cart
    } catch (error) {
      if (error?.status !== 404) {
        throw error
      }

      clearCartId()
    }
  }

  const { cart } = await sdk.store.cart.create({})

  setCartId(cart.id)

  return cart
}

export const addLineItem = async (variantId, quantity = 1) => {
  const cart = await getOrCreateCart()
  const { cart: updatedCart } = await sdk.store.cart.createLineItem(cart.id, {
    variant_id: variantId,
    quantity,
  })

  return updatedCart
}

export const updateLineItem = async (lineItemId, quantity) => {
  const cartId = getRequiredCartId()
  const { cart } = await sdk.store.cart.updateLineItem(cartId, lineItemId, {
    quantity,
  })

  return cart
}

export const deleteLineItem = async (lineItemId) => {
  const cartId = getRequiredCartId()

  await sdk.store.cart.deleteLineItem(cartId, lineItemId)

  const { cart } = await sdk.store.cart.retrieve(cartId)

  return cart
}

export const applyPromoCode = async (code) => {
  try {
    const cartId = getRequiredCartId()
    const { cart } = await sdk.store.cart.update(cartId, {
      promo_codes: [code],
    })

    return { success: true, cart }
  } catch (error) {
    return {
      success: false,
      message: error?.message || "優惠碼套用失敗，請稍後再試",
    }
  }
}

export const removePromoCode = async (code) => {
  const cartId = getRequiredCartId()
  const { cart } = await sdk.store.cart.retrieve(cartId)
  const promoCodes = (cart.promotions || [])
    .map((promotion) => promotion.code)
    .filter(Boolean)
    .filter((promotionCode) => promotionCode !== code)

  const { cart: updatedCart } = await sdk.store.cart.update(cartId, {
    promo_codes: promoCodes,
  })

  return updatedCart
}

export const addShippingMethod = async (optionId) => {
  const cartId = getRequiredCartId()
  const { cart } = await sdk.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
  })

  return cart
}

export const completeCart = async () => {
  const cartId = getRequiredCartId()
  const result = await sdk.store.cart.complete(cartId)

  if (result?.type === "order") {
    clearCartId()
  }

  return result
}

export const updateCartAddress = async (shippingAddress) => {
  const cartId = getRequiredCartId()
  const { cart } = await sdk.store.cart.update(cartId, {
    shipping_address: shippingAddress,
  })

  return cart
}

export const initPaymentCollection = async () => {
  const cart = await getOrCreateCart()
  const response = await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: "pp_system_default",
  })

  return response?.payment_collection || null
}
