import { useState } from 'react'

const MOCK_PROMO_CODES = {
  POLAR10: { discountAmount: 100, message: '折扣 NT$100' },
  WELCOME: { discountAmount: 50, message: '新會員折扣 NT$50' },
}

export function usePromoCode() {
  const [code, setCode]           = useState('')
  const [isApplied, setIsApplied] = useState(false)
  const [discount, setDiscount]   = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState(null)

  const apply = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!code.trim()) return

    setIsLoading(true)
    setError(null)

    await new Promise((r) => setTimeout(r, 300))

    const promo = MOCK_PROMO_CODES[code.trim().toUpperCase()]
    if (promo) {
      setDiscount(promo.discountAmount)
      setIsApplied(true)
    } else {
      setError('優惠碼無效或已過期')
      setIsApplied(false)
      setDiscount(0)
    }

    setIsLoading(false)
  }

  const remove = () => {
    setCode('')
    setDiscount(0)
    setIsApplied(false)
    setError(null)
  }

  return {
    code,
    setCode,
    apply,
    remove,
    discount,
    isApplied,
    isLoading,
    error,
  }
}
