const BASE_URL = import.meta.env.VITE_MEDUSA_API_URL || 'http://localhost:9000'
const API_KEY  = import.meta.env.VITE_MEDUSA_API_KEY || ''

/**
 * 向後端取得 PayUni UPP 表單資料
 *
 * @param {{ orderId: string, paymentMethod: 'credit' | 'linepay' }} params
 * @returns {Promise<{ form_action: string, fields: Record<string, string> }>}
 */
export async function initiatePayuniPayment({ orderId, paymentMethod }) {
  if (!BASE_URL) {
    throw new Error('後端 API URL 未配置')
  }

  if (!orderId || !paymentMethod) {
    throw new Error('缺少必要參數：orderId 或 paymentMethod')
  }

  const url = `${BASE_URL}/store/payment/payuni/initiate`

  try {
    const res = await fetch(url, {
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
      let errorMsg = '付款初始化失敗'
      try {
        const err = await res.json()
        errorMsg = err.message || errorMsg
      } catch {
        errorMsg = `${errorMsg}（${res.status} ${res.statusText}）`
      }
      throw new Error(errorMsg)
    }

    return res.json()
  } catch (err) {
    console.error('[PaymentAPI] initiatePayuniPayment 錯誤:', err)

    // 區分網路錯誤和其他錯誤
    if (err instanceof TypeError) {
      throw new Error('網路連線錯誤，請檢查網路後重試')
    }

    throw err
  }
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
