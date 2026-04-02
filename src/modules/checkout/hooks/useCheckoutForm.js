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
  deliveryCity:   '',
  deliveryDistrict: '',
  deliveryZip:    '',
  deliveryAddress: '',
  storeId:        '',
  storeCity:      '',
  storeName:      '',
  storeAddress:   '',
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
      deliveryCity:   form.deliveryCity,
      deliveryDistrict: form.deliveryDistrict,
      deliveryZip:    form.deliveryZip,
      deliveryAddress: form.deliveryAddress,
      storeId:        form.storeId,
      storeCity:      form.storeCity,
      storeName:      form.storeName,
      storeAddress:   form.storeAddress,
      shippingAddress:
        form.shippingMethod === 'home'
          ? {
              city: form.deliveryCity,
              district: form.deliveryDistrict,
              zip: form.deliveryZip,
              address: form.deliveryAddress,
              full: `${form.deliveryZip} ${form.deliveryCity}${form.deliveryDistrict}${form.deliveryAddress}`,
            }
          : {
              city: form.storeCity,
              storeId: form.storeId,
              storeName: form.storeName,
              storeAddress: form.storeAddress,
              full: `${form.storeCity} ${form.storeName} ${form.storeAddress}`,
            },
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
