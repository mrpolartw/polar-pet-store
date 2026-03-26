import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import orderService from '../../../services/orderService'
import { validateName, validatePhone, validateEmail, validateForm } from '../../../utils/validators'
import { useCart } from '../../../context/useCart'
import { ROUTES } from '../../../constants/routes'
import analytics from '../../../utils/analytics'

/**
 * 訂單送出邏輯 hook
 * 整合表單驗證 → API 呼叫 → 清空購物車 → 跳轉確認頁
 */
export function useOrderSubmit() {
  const navigate = useNavigate()
  const { cartItems, clearCart } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState(null)
  const [fieldErrors, setFieldErrors]   = useState({})

  const submit = async (payload) => {
    if (cartItems.length === 0) {
      setSubmitError('購物車是空的，請先加入商品')
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
      const data = await orderService.createOrder({
        ...payload,
        items: cartItems,
      })
      const orderId = data?.order?.id ?? data?.id
      if (!orderId) throw new Error('訂單建立失敗，請再試一次')

      await clearCart()
      analytics.purchase({
        id:          orderId,
        total:       payload.total,
        shippingFee: payload.shippingFee,
        promoCode:   payload.promoCode,
        items:       cartItems,
      })
      navigate(
        ROUTES.ORDER_CONFIRM.replace(':orderId', orderId),
        { state: { order: data?.order ?? data } }
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
