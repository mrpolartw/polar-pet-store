import { useCallback, useState } from 'react';

/**
 * @template {unknown[]} TArgs
 * @template TResult
 * @param {(...args: TArgs) => Promise<TResult> | TResult} serviceFunction - The service function to execute.
 * @returns {{
 *   data: TResult | null,
 *   isLoading: boolean,
 *   error: { message: string } | null,
 *   execute: (...args: TArgs) => Promise<
 *     { success: true, data: TResult } |
 *     { success: false, error: { message: string } }
 *   >,
 *   reset: () => void
 * }} API state and helpers.
 *
 * @description 通用 API 呼叫 hook，管理 isLoading / data / error 狀態
 * 使用範例：
 *   const { data, isLoading, error, execute } = useApi(orderService.getOrder);
 *   useEffect(() => { execute(orderId); }, [orderId]);
 */
export function useApi(serviceFunction) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await serviceFunction(...args);
        setData(result);

        return {
          success: true,
          data: result,
        };
      } catch (err) {
        const normalizedError = {
          message:
            err && typeof err === 'object' && 'message' in err && err.message
              ? err.message
              : '發生未知錯誤',
        };

        setError(normalizedError);

        return {
          success: false,
          error: normalizedError,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [serviceFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}

export default useApi;
