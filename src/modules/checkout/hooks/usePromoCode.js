import { useState } from 'react'
import orderService from '../../../services/orderService'

/**
 * 優惠碼邏輯 hook
 * 管理優惠碼輸入、驗證、套用、移除
 */
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

    try {
      const data = await orderService.validatePromoCode(code)
      if (!data || data.valid === false) {
        throw new Error(data?.message || '優惠碼無效或已過期')
      }
      setDiscount(data?.discountAmount ?? 0)
      setIsApplied(true)
    } catch (err) {
      setError(err?.message || '優惠碼驗證失敗，請再試一次')
      setIsApplied(false)
      setDiscount(0)
    } finally {
      setIsLoading(false)
    }
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
