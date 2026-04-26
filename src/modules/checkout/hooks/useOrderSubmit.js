import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '../../../constants/routes'
import { useCart } from '../../../context/useCart'
import analytics from '../../../utils/analytics'
import {
  validateEmail,
  validateForm,
  validateName,
  validatePhone,
} from '../../../utils/validators'

export function useOrderSubmit() {
  const navigate = useNavigate()
  const { cartItems, clearCart } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const submit = async (payload) => {
    if (cartItems.length === 0) {
      setSubmitError('購物車內目前沒有商品，請先加入商品再送出訂單。')
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

    const orderId = `PL-${Date.now()}`
    const order = {
      id: orderId,
      ...payload,
      items: cartItems,
    }

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

    setIsSubmitting(false)
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
