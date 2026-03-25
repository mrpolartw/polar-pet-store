import { useState, useEffect, useCallback } from 'react'

export function useApi(apiFn, deps = []) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await apiFn()
      setData(result)
    } catch (err) {
      setError(err?.message || '發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    execute()
  }, [execute])

  return { data, isLoading, error, refetch: execute }
}
