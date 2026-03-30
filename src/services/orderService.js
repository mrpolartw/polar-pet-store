import { MEDUSA_API_URL, PUBLISHABLE_API_KEY, sdk } from '../lib/medusa'

const STORE_API_URL = MEDUSA_API_URL
const STORE_PICKUP_ADDRESS = '超商取貨'

function isPublicOrderId(value) {
  return /^PL-\d+$/i.test(String(value || '').trim()) || /^\d+$/.test(String(value || '').trim())
}

function normalizeShippingOptionText(option) {
  return [
    option?.name,
    option?.type?.label,
    option?.type?.description,
    option?.service_zone?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function selectShippingOption(shippingOptions = [], shippingMethod = 'home') {
  if (!Array.isArray(shippingOptions) || shippingOptions.length === 0) {
    return null
  }

  const optionMatcher = shippingMethod === 'store'
    ? ['超商', '取貨', 'pickup', 'store']
    : ['宅配', 'home', 'delivery', 'express', 'standard']

  return (
    shippingOptions.find((option) =>
      optionMatcher.some((keyword) => normalizeShippingOptionText(option).includes(keyword)),
    )
    || shippingOptions[0]
  )
}

function buildGuestOrderQuery(params = {}) {
  const query = new URLSearchParams()

  if (params.order_id) query.set('order_id', params.order_id)
  if (params.phone) query.set('phone', params.phone)

  return query.toString()
}

async function fetchGuestOrders(params = {}) {
  const query = buildGuestOrderQuery(params)
  const url = `${STORE_API_URL}/store/orders/query${query ? `?${query}` : ''}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(PUBLISHABLE_API_KEY ? { 'x-publishable-api-key': PUBLISHABLE_API_KEY } : {}),
    },
  })

  let data = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`)
    error.status = response.status
    throw error
  }

  return data.orders || []
}

function buildShippingAddress(checkoutPayload = {}) {
  const isStorePickup = checkoutPayload.shippingMethod === 'store'

  return {
    first_name: checkoutPayload.recipientName || checkoutPayload.buyerName || 'Guest',
    last_name: '',
    phone: checkoutPayload.recipientPhone || checkoutPayload.buyerPhone || '',
    address_1: isStorePickup ? STORE_PICKUP_ADDRESS : (checkoutPayload.address || '未提供地址'),
    address_2: isStorePickup ? (checkoutPayload.storeName || '') : '',
    city: isStorePickup ? '' : (checkoutPayload.city || ''),
    province: isStorePickup ? '' : (checkoutPayload.district || ''),
    postal_code: '000',
    country_code: 'tw',
  }
}

export function getPublicOrderId(order) {
  if (order?.id?.startsWith?.('PL-')) {
    return order.id
  }

  if (order?.display_id) {
    return `PL-${order.display_id}`
  }

  return order?.id || ''
}

export const getOrders = async (filters = {}) => {
  if (filters.phone || filters.order_id || filters.orderId) {
    const orders = await fetchGuestOrders({
      order_id: filters.order_id || filters.orderId,
      phone: filters.phone,
    })

    return { orders }
  }

  const { orders } = await sdk.store.order.list({
    fields: '*items,*items.variant,*items.variant.product',
  })

  return { orders: orders || [] }
}

export const getOrder = async (orderId, options = {}) => {
  if (!orderId) {
    throw new Error('缺少訂單編號')
  }

  if (options.guestLookup || isPublicOrderId(orderId)) {
    const [order] = await fetchGuestOrders({
      order_id: orderId,
      phone: options.phone,
    })

    if (!order) {
      const error = new Error('找不到訂單資料')
      error.status = 404
      throw error
    }

    return { order }
  }

  try {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields: '*items,*items.variant,*items.variant.product',
    })

    return { order }
  } catch (error) {
    if (options.skipGuestFallback) {
      throw error
    }

    const [guestOrder] = await fetchGuestOrders({
      order_id: orderId,
      phone: options.phone,
    })

    if (guestOrder) {
      return { order: guestOrder }
    }

    throw error
  }
}

export const prepareCart = async (
  cartId,
  { email, buyerPhone, paymentMethod, checkoutPayload },
) => {
  let { cart } = await sdk.store.cart.update(cartId, {
    email,
    shipping_address: buildShippingAddress(checkoutPayload),
    metadata: {
      buyer_phone: buyerPhone,
      payment_method: paymentMethod,
      shipping_method: checkoutPayload.shippingMethod,
      promo_code: checkoutPayload.promoCode || null,
      checkout_info: checkoutPayload,
    },
  })

  try {
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
      cart_id: cartId,
    })

    const selectedOption = selectShippingOption(
      shipping_options,
      checkoutPayload.shippingMethod,
    )

    if (selectedOption) {
      const hasAppliedOption = (cart.shipping_methods || []).some(
        (method) =>
          method.shipping_option_id === selectedOption.id
          || method.name === selectedOption.name,
      )

      if (!hasAppliedOption) {
        const response = await sdk.store.cart.addShippingMethod(cartId, {
          option_id: selectedOption.id,
        })

        cart = response.cart
      }
    }
  } catch (error) {
    console.warn('Failed to attach shipping option:', error)
  }

  try {
    const { payment_providers } = await sdk.store.payment.listPaymentProviders({
      region_id: cart.region_id,
    })

    const provider =
      payment_providers?.find((item) => item.id === 'pp_system_default')
      || payment_providers?.[0]

    if (provider) {
      await sdk.store.payment.initiatePaymentSession(cart, {
        provider_id: provider.id,
      })
    }
  } catch (error) {
    console.warn('Failed to create payment session:', error)
  }

  return { cart }
}

export const createOrder = async (cartId) => {
  const result = await sdk.store.cart.complete(cartId)

  if (result.type !== 'order') {
    throw new Error(result.error?.message || '訂單建立失敗，請再試一次')
  }

  return { order: result.order }
}

export const validatePromoCode = async (code) => {
  if (!String(code || '').trim()) {
    return {
      valid: false,
      message: '請輸入優惠碼',
    }
  }

  return {
    valid: false,
    message: '優惠碼功能尚未開放',
  }
}

export default {
  prepareCart,
  createOrder,
  getOrder,
  getOrders,
  getPublicOrderId,
  validatePromoCode,
}
