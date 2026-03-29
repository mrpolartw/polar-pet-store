const BASE_URL = import.meta.env.VITE_MEDUSA_API_URL || 'http://localhost:9000'
const API_KEY  = import.meta.env.VITE_MEDUSA_API_KEY || ''

/**
 * 向後端取得 PayUni UPP 表單資料
 *
 * @param {{ orderId: string, paymentMethod: 'credit' | 'linepay' }} params
 * @returns {Promise<{ form_action: string, fields: Record<string, string> }>}
 */
export async function initiatePayuniPayment({ orderId, paymentMethod }) {
  const res = await fetch(`${BASE_URL}/store/payment/payuni/initiate`, {
    method:      'POST',
    credentials: 'include',
    headers: {
      'Content-Type':           'application/json',
      'x-publishable-api-key':  API_KEY,
    },
    body: JSON.stringify({
      order_id:       orderId,
      payment_method: paymentMethod,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '付款初始化失敗，請稍後再試')
  }

  return res.json()
}

/**
 * 動態建立並提交隱藏表單，將瀏覽器 POST 至 PayUni UPP 付款頁。
 *
 * @param {string} action   PayUni UPP URL
 * @param {Record<string, string>} fields  PayUni 所需表單欄位
 */
export function submitPayuniForm(action, fields) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type  = 'hidden'
    input.name  = name
    input.value = String(value)
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
}
