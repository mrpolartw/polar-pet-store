import React from 'react'

/**
 * @description 通用空狀態元件
 * @param {Object} props
 * @param {React.ReactNode} [props.icon='📭'] - 圖示（emoji 或 React node）
 * @param {string} props.title - 主標題
 * @param {string} [props.description] - 說明文字
 * @param {string} [props.actionLabel] - 按鈕文字
 * @param {Function} [props.onAction] - 按鈕點擊事件
 * @param {React.ReactNode} [props.action] - 自訂按鈕 node（優先於 actionLabel）
 * @param {string} [props.className] - 外層容器 className
 */
export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  action,
  className = '',
}) {
  const isNodeIcon = React.isValidElement(icon)

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
      {isNodeIcon ? (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-bg-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          {icon}
        </div>
      ) : (
        <span
          style={{
            fontSize: 52,
            marginBottom: 16,
            display: 'block',
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      )}

      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--color-text-dark)',
          marginBottom: 8,
          fontFamily: 'var(--font-family-display)',
        }}
      >
        {title}
      </h3>

      {description ? (
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-gray-dark)',
            lineHeight: 1.6,
            maxWidth: 320,
            marginBottom: 24,
          }}
        >
          {description}
        </p>
      ) : null}

      {action ? action : null}

      {!action && actionLabel && onAction ? (
        <button
          type="button"
          className="btn-blue"
          onClick={onAction}
          style={{
            padding: '10px 24px',
            borderRadius: 980,
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
