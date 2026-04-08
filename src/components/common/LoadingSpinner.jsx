import React, { useEffect } from 'react'

const STYLE_ID = 'loading-spinner-keyframes'

const SIZE_MAP = {
  small: { dimension: 20, borderWidth: 2 },
  medium: { dimension: 36, borderWidth: 3 },
  large: { dimension: 52, borderWidth: 4 },
}

/**
 * @description 通用 Loading Spinner 元件
 * @param {Object} props
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Spinner 大小
 * @param {string} [props.label] - 可選說明文字
 * @param {string} [props.className] - 外層容器 className
 * @param {boolean} [props.fullPage=false] - 是否撐滿整個容器高度
 * @param {import('react').CSSProperties} [props.style] - 外層容器額外樣式
 */
export default function LoadingSpinner({
  size = 'medium',
  label,
  className = '',
  fullPage = false,
  style,
}) {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
      return
    }

    const styleTag = document.createElement('style')
    styleTag.id = STYLE_ID
    styleTag.textContent = '@keyframes ls-spin { to { transform: rotate(360deg); } }'
    document.head.appendChild(styleTag)
  }, [])

  const currentSize = SIZE_MAP[size] || SIZE_MAP.medium

  return (
    <div
      className={className}
      style={{
        minHeight: fullPage ? '40vh' : 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: currentSize.dimension,
          height: currentSize.dimension,
          border: `${currentSize.borderWidth}px solid var(--color-gray-light)`,
          borderTopColor: 'var(--color-brand-blue)',
          borderRadius: '50%',
          animation: 'ls-spin 0.8s linear infinite',
        }}
      />
      {label ? (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: 'var(--color-gray-dark)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          {label}
        </p>
      ) : null}
    </div>
  )
}
