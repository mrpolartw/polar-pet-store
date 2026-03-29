import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import orderService from '../../../services/orderService'
import { initiatePayuniPayment, submitPayuniForm } from '../../../api/payment'
import { validateName, validatePhone, validateEmail, validateForm } from '../../../utils/validators'
import { useCart } from '../../../context/useCart'
import { ROUTES } from '../../../constants/routes'
import analytics from '../../../utils/analytics'

const PAYUNI_METHODS = ['credit', 'linepay']

/**
 * 訂單送出邏輯 hook
 *
 * 流程：表單驗證 → prepareCart → createOrder → clearCart
 *       → 信用卡/LINE Pay：initiatePayuniPayment → 跳轉 PayUni UPP 付款頁
 *       → 其他付款方式：navigate 至訂單確認頁
 */
export function useOrderSubmit() {
  const navigate = useNavigate()
  const { cartItems, cartId, clearCart } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError,  setSubmitError]  = useState(null)
  const [fieldErrors,  setFieldErrors]  = useState({})

  const submit = async (payload) => {
    if (cartItems.length === 0) {
      setSubmitError('購物車是空的，請先加入商品')
      return
    }
    if (!cartId) {
      setSubmitError('購物車狀態異常，請重新整理後再試')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    const { isValid, errors } = validateForm([
      { field: 'recipientName',  value: payload.recipientName,  validator: validateName  },
      { field: 'recipientPhone', value: payload.recipientPhone, validator: validatePhone },
      { field: 'recipientEmail', value: payload.buyerEmail,     validator: validateEmail },
    ])

    if (!isValid) {
      setFieldErrors(errors)
      setIsSubmitting(false)
      const firstErrorKey = Object.keys(errors)[0]
      const el = document.getElementById(firstErrorKey)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      // 1. 更新購物車 email 與 metadata（訂單查詢 / 點數計算使用）
      await orderService.prepareCart(cartId, {
        email:         payload.buyerEmail,
        buyerPhone:    payload.buyerPhone,
        paymentMethod: payload.paymentMethod,
      })

      // 2. 完成購物車 → 建立 Medusa 訂單
      const { order } = await orderService.createOrder(cartId)
      if (!order?.id) throw new Error('訂單建立失敗，請再試一次')

      // 3. 清空購物車（訂單已建立，不再需要）
      await clearCart()

      // 4a. 信用卡 / LINE Pay → 取得 PayUni 表單資料並跳轉付款頁
      if (PAYUNI_METHODS.includes(payload.paymentMethod)) {
        const { form_action, fields } = await initiatePayuniPayment({
          orderId:       order.id,
          paymentMethod: payload.paymentMethod,
        })
        // 動態提交隱藏表單，瀏覽器跳轉至 PayUni UPP
        submitPayuniForm(form_action, fields)
        // 跳轉後以下程式碼不會執行
        return
      }

      // 4b. 其他付款方式（未來擴充）：直接導至訂單確認頁
      analytics.purchase({
        id:          order.id,
        total:       payload.total,
        shippingFee: payload.shippingFee,
        promoCode:   payload.promoCode,
        items:       cartItems,
      })
      navigate(
        ROUTES.ORDER_CONFIRM.replace(':orderId', order.id),
        { state: { order } }
      )
    } catch (err) {
      setSubmitError(err?.message || '訂單送出失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    submit,
    isSubmitting,
    submitError,
    fieldErrors,
    setFieldErrors,
    setSubmitError,
  }
}
