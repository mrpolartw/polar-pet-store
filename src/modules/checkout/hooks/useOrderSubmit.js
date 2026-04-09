import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import orderService from '../../../services/orderService'
import membershipService from '../../../services/membershipService'
import { validateName, validatePhone, validateEmail, validateForm } from '../../../utils/validators'
import { useCart } from '../../../context/useCart'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/ToastContext'
import { ROUTES } from '../../../constants/routes'
import analytics from '../../../utils/analytics'

export function useOrderSubmit() {
  const navigate = useNavigate()
  const { cartItems, clearCart } = useCart()
  const { refreshMembership } = useAuth()
  const toast = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const submit = async (payload) => {
    if (cartItems.length === 0) {
      setSubmitError('購物車目前沒有商品，請先加入商品再結帳')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setFieldErrors({})

    const { isValid, errors } = validateForm([
      { field: 'recipientName', value: payload.recipientName, validator: validateName },
      { field: 'recipientPhone', value: payload.recipientPhone, validator: validatePhone },
      { field: 'recipientEmail', value: payload.buyerEmail, validator: validateEmail },
    ])

    if (!isValid) {
      setFieldErrors(errors)
      setIsSubmitting(false)

      const firstErrorKey = Object.keys(errors)[0]
      const fieldElement = document.getElementById(firstErrorKey)

      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      return
    }

    try {
      const data = await orderService.createOrder({
        ...payload,
        items: cartItems,
      })
      const order = data?.order ?? data ?? null
      const orderId = order?.id

      if (!orderId) {
        throw new Error('訂單成立失敗，請稍後再試')
      }

      if (payload.pointRedemption?.redemptionAmount > 0) {
        try {
          await membershipService.applyPointRedemption({
            points: payload.pointRedemption.redemptionAmount,
            orderSubtotal: payload.pointRedemption.orderSubtotal ?? payload.subtotal,
            referenceId:
              payload.pointRedemption.referenceId ?? `order:${orderId}:points`,
            note: `前台訂單 ${orderId} 點數折抵`,
          })
        } catch (redemptionError) {
          toast.warning(
            redemptionError?.message ||
              '訂單已成立，但點數折抵同步失敗，請稍後到會員中心確認'
          )
        }
      }

      await refreshMembership()
      await clearCart()

      analytics.purchase({
        id: orderId,
        total: payload.total,
        shippingFee: payload.shippingFee,
        promoCode: payload.promoCode,
        items: cartItems,
      })

      navigate(ROUTES.ORDER_CONFIRM.replace(':orderId', orderId), {
        state: {
          order,
        },
      })
    } catch (err) {
      setSubmitError(err?.message || '送出訂單失敗，請稍後再試')
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
