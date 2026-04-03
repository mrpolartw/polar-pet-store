/**
 * @deprecated 此檔案已廢棄，請改用 src/lib/woocommerce.js
 * 保留此 stub 以避免尚未完成遷移的模組在 import 時出錯。
 */

const warnOnce = (() => {
  const warned = new Set()
  return (key) => {
    if (!warned.has(key)) {
      console.warn(`[medusa.js] "${key}" 呼叫尚未遷移至 WooCommerce API`)
      warned.add(key)
    }
  }
})()

const stub = (path) => (..._args) => {
  warnOnce(path)
  return Promise.resolve({})
}

export const sdk = {
  auth: {
    login:          stub('sdk.auth.login'),
    register:       stub('sdk.auth.register'),
    logout:         stub('sdk.auth.logout'),
    updateProvider: stub('sdk.auth.updateProvider'),
  },
  store: {
    customer: {
      retrieve: stub('sdk.store.customer.retrieve'),
      create:   stub('sdk.store.customer.create'),
      update:   stub('sdk.store.customer.update'),
    },
    cart: {
      retrieve:         stub('sdk.store.cart.retrieve'),
      create:           stub('sdk.store.cart.create'),
      update:           stub('sdk.store.cart.update'),
      createLineItem:   stub('sdk.store.cart.createLineItem'),
      updateLineItem:   stub('sdk.store.cart.updateLineItem'),
      deleteLineItem:   stub('sdk.store.cart.deleteLineItem'),
      addShippingMethod: stub('sdk.store.cart.addShippingMethod'),
      complete:         stub('sdk.store.cart.complete'),
    },
    product: {
      list: stub('sdk.store.product.list'),
    },
    order: {
      list:     stub('sdk.store.order.list'),
      retrieve: stub('sdk.store.order.retrieve'),
    },
    region: {
      list: stub('sdk.store.region.list'),
    },
    shippingOption: {
      list: stub('sdk.store.shippingOption.list'),
    },
  },
}
