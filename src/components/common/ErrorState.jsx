import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

/**
 * @description 通用錯誤狀態元件
 * @param {Object} props
 * @param {string} [props.message='發生錯誤，請稍後再試'] - 錯誤訊息
 * @param {Function} [props.onRetry] - 重試按鈕點擊事件（不傳則不顯示按鈕）
 * @param {string} [props.retryLabel='重新載入'] - 重試按鈕文字
 * @param {string} [props.className] - 外層容器 className
 */
export default function ErrorState({
  message = '發生錯誤，請稍後再試',
  onRetry,
  retryLabel = '重新載入',
  className = '',
}) {
  return (
    <div
      className={className}
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <AlertCircle
        size={48}
        color="var(--color-brand-coffee)"
        style={{ marginBottom: 16 }}
      />

      <p
        style={{
          fontSize: 15,
          color: 'var(--color-gray-dark)',
          lineHeight: 1.6,
          maxWidth: 320,
          marginBottom: onRetry ? 24 : 0,
        }}
      >
        {message}
      </p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '10px 24px',
            borderRadius: 980,
            border: '1.5px solid var(--color-gray-light)',
            background: 'var(--color-bg-white)',
            color: 'var(--color-text-dark)',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <RotateCcw size={14} />
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
