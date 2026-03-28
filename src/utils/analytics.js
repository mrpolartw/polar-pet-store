import { storage } from './storage'
import { CONFIG } from '../constants/config'

/** 檢查使用者是否已同意分析 Cookie */
function isAnalyticsAllowed() {
  const consent = storage.get(CONFIG.COOKIE_CONSENT_KEY)
  // 若尚未選擇，預設不追蹤
  return consent?.analytics === true
}

/** 安全呼叫 gtag，任何錯誤不影響使用者操作 */
function gtag(...args) {
  try {
    if (typeof window === 'undefined') return
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || []
      window.gtag = function () { window.dataLayer.push(arguments) }
    }
    window.gtag(...args)
  } catch {
    // 靜默失敗
  }
}

/** 初始化 GA4（取得 Cookie 同意後呼叫） */
function initGA() {
  try {
    const gaId = import.meta.env.VITE_GA_ID || window.__GA_ID__
    if (!gaId || gaId === 'G-XXXXXXXXXX') return

    // 動態載入 GA script
    if (!document.getElementById('ga-script')) {
      const script = document.createElement('script')
      script.id = 'ga-script'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      document.head.appendChild(script)
    }

    gtag('js', new Date())
    gtag('config', gaId, {
      send_page_view: false, // 手動控制 page view
    })
  } catch {
    // 靜默失敗
  }
}

/**
 * 格式化商品資料為 GA4 items 格式
 * @param {object} product
 * @param {number} quantity
 * @returns {object}
 */
function formatItem(product, quantity = 1) {
  return {
    item_id:    product?.id   ?? product?.slug ?? '',
    item_name:  product?.name ?? '',
    item_brand: 'Mr.Polar 北極先生',
    item_category: product?.category ?? '',
    price:      product?.price ?? 0,
    quantity,
  }
}

export const analytics = {
  /** 初始化（Cookie 同意後呼叫） */
  init: initGA,

  /** 頁面瀏覽 */
  pageView(path, title) {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'page_view', {
      page_path:  path,
      page_title: title,
    })
  },

  /** 商品詳情頁瀏覽 */
  viewItem(product) {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'view_item', {
      currency: 'TWD',
      value:    product?.price ?? 0,
      items:    [formatItem(product)],
    })
  },

  /** 商品列表瀏覽 */
  viewItemList(products, listName = '商品列表') {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'view_item_list', {
      item_list_name: listName,
      items: products.slice(0, 20).map((p, i) => ({
        ...formatItem(p),
        index: i,
      })),
    })
  },

  /** 加入購物車 */
  addToCart(product, quantity = 1) {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'add_to_cart', {
      currency: 'TWD',
      value:    (product?.price ?? 0) * quantity,
      items:    [formatItem(product, quantity)],
    })
  },

  /** 從購物車移除 */
  removeFromCart(product, quantity = 1) {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'remove_from_cart', {
      currency: 'TWD',
      value:    (product?.price ?? 0) * quantity,
      items:    [formatItem(product, quantity)],
    })
  },

  /** 開始結帳 */
  beginCheckout(cartItems, subtotal) {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'begin_checkout', {
      currency: 'TWD',
      value:    subtotal ?? 0,
      items:    cartItems.map((item) =>
        formatItem(item, item.quantity ?? 1)
      ),
    })
  },

  /** 選擇配送方式 */
  addShippingInfo(shippingMethod) {
    if (!isAnalyticsAllowed()) return
    const label = shippingMethod === 'store' ? '超商取貨' : '宅配到府'
    gtag('event', 'add_shipping_info', {
      shipping_tier: label,
    })
  },

  /** 選擇付款方式 */
  addPaymentInfo(paymentMethod) {
    if (!isAnalyticsAllowed()) return
    const labels = {
      credit:  '信用卡',
      linepay: 'LINE Pay',
      applepay:'Apple Pay',
      atm:     'ATM 轉帳',
    }
    gtag('event', 'add_payment_info', {
      payment_type: labels[paymentMethod] ?? paymentMethod,
    })
  },

  /** 訂單完成（購買） */
  purchase(order) {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'purchase', {
      transaction_id: order?.id ?? order?.orderId ?? '',
      currency:       'TWD',
      value:          order?.total ?? 0,
      shipping:       order?.shippingFee ?? 0,
      coupon:         order?.promoCode ?? '',
      items: (order?.items ?? []).map((item) =>
        formatItem(item, item.quantity ?? 1)
      ),
    })
  },

  /** 使用者登入 */
  login(method = 'email') {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'login', { method })
  },

  /** 使用者註冊 */
  signUp(method = 'email') {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'sign_up', { method })
  },

  /** 站內搜尋 */
  search(term) {
    if (!isAnalyticsAllowed()) return
    gtag('event', 'search', { search_term: term })
  },
}

export default analytics
