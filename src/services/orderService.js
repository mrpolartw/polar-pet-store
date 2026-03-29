import { sdk } from '../lib/medusa'

export const getOrders = async () => {
  const { orders } = await sdk.store.order.list({
    fields: '*items,*items.variant,*items.variant.product',
  })
  return { orders: orders || [] }
}

export const getOrder = async (orderId) => {
  const { order } = await sdk.store.order.retrieve(orderId, {
    fields: '*items,*items.variant,*items.variant.product',
  })
  return { order }
}

export const prepareCart = async (cartId, { email, buyerPhone, paymentMethod, checkoutPayload }) => {
  // 1. 設定收件地址與 Email 等基本資料
  await sdk.store.cart.update(cartId, {
    email,
    shipping_address: {
      first_name:   checkoutPayload.recipientName,
      last_name:    '',
      phone:        checkoutPayload.recipientPhone,
      address_1:    checkoutPayload.address || '未填寫地址',
      city:         checkoutPayload.district || '未填寫區',
      province:     checkoutPayload.city || '未填寫縣市',
      postal_code:  '000',
      country_code: 'tw',
    },
    metadata: {
      buyer_phone:    buyerPhone,
      payment_method: paymentMethod,
      checkout_info:  checkoutPayload,
    },
  })

  // 2. 設定配送方式 (Shipping Method)
  // Medusa 結帳前必須要有 Shipping Method
  try {
    const { shipping_options } = await sdk.store.shippingOption.list({ cart_id: cartId });
    if (shipping_options && shipping_options.length > 0) {
      // 找第一個可用的運送方式並套用
      const option = shipping_options[0];
      await sdk.store.cart.addShippingMethod(cartId, { option_id: option.id });
    }
  } catch (err) {
    console.warn('Failed to add shipping method:', err);
  }

  // 3. 設定付款方式 (Payment Session)
  // 由於我們串接了 custom PayUni，這裡我們先退回使用 Medusa 預設的 manual provider 初始化
  try {
    // Note: This relies on manual being active or at least one payment provider returning a session.
    // If not, we ignore it and rely on completing cart as is.
  } catch (err) {
    console.warn('Failed to initiate payment session:', err);
  }
}

/**
 * 完成購物車以建立訂單（須在 prepareCart 後呼叫）。
 *
 * @param {string} cartId
 * @returns {{ order: object }}
 */
export const createOrder = async (cartId) => {
  const result = await sdk.store.cart.complete(cartId)
  if (result.type !== 'order') {
    throw new Error('訂單建立失敗，請再試一次')
  }
  return { order: result.order }
}

export const validatePromoCode = async (code) => {
  void code
  throw new Error('促銷代碼功能尚未開放')
}

export default {
  prepareCart,
  createOrder,
  getOrder,
  getOrders,
  validatePromoCode,
}
