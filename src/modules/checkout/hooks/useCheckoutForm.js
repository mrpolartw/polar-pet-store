import { useState } from 'react'
import { CONFIG } from '../../../constants/config'

const INITIAL_FORM = {
  shippingMethod: 'home',
  paymentMethod:  'credit',
  invoiceType:    'member',
  sameAsBuyer:    true,
  buyerName:      '',
  buyerEmail:     '',
  buyerPhone:     '',
  recipientName:  '',
  recipientPhone: '',
  invoiceMobile:  '',
  invoiceTaxId:   '',
  invoiceCompany: '',
  invoiceDonateCode: '',
  storeId:        '',
  storeName:      '',
  deliveryNote:   '',
}

/**
 * 結帳表單狀態管理 hook
 * 不含任何 API 呼叫或 navigate 邏輯
 */
export function useCheckoutForm(initialValues = {}) {
  const [form, setForm] = useState({ ...INITIAL_FORM, ...initialValues })

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => setForm({ ...INITIAL_FORM, ...initialValues })

  const getPayload = (promoCode, isPromoApplied, subtotal, discount) => {
    const shippingFee =
      form.shippingMethod === 'store' ? 0 : CONFIG.SHIPPING_FEE
    const total = subtotal + shippingFee - discount

    return {
      shippingMethod: form.shippingMethod,
      paymentMethod:  form.paymentMethod,
      invoiceType:    form.invoiceType,
      buyerName:      form.buyerName,
      buyerEmail:     form.buyerEmail,
      buyerPhone:     form.buyerPhone,
      recipientName:  form.sameAsBuyer ? form.buyerName  : form.recipientName,
      recipientPhone: form.sameAsBuyer ? form.buyerPhone : form.recipientPhone,
      invoiceMobile:  form.invoiceMobile,
      invoiceTaxId:   form.invoiceTaxId,
      invoiceCompany: form.invoiceCompany,
      invoiceDonateCode: form.invoiceDonateCode,
      storeId:        form.storeId,
      storeName:      form.storeName,
      deliveryNote:   form.deliveryNote,
      promoCode:      isPromoApplied ? promoCode : null,
      subtotal,
      shippingFee,
      discount,
      total,
    }
  }

  return { form, setField, resetForm, getPayload }
}
