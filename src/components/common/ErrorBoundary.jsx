import React from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * @fileoverview 全域錯誤邊界元件
 * @description 捕捉子元件樹的 render 錯誤，防止整頁白屏。
 *   - development：顯示錯誤詳情，方便除錯
 *   - production：顯示友善錯誤頁，隱藏技術細節
 * @note ErrorBoundary 必須為 class component（React 限制）
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] 捕捉到錯誤：', error)
      console.error('[ErrorBoundary] 錯誤堆疊：', errorInfo.componentStack)
    }
    // TODO: [MONITORING] production 環境請在此接入錯誤監控系統
    // 例如：Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props
    const isDev = import.meta.env.DEV

    if (!hasError) return children

    if (fallback) return fallback

    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <AlertTriangle
              size={48}
              color="var(--color-brand-coffee, #a0522d)"
              strokeWidth={1.5}
            />
          </div>

          <h2 style={styles.title}>抱歉，頁面發生錯誤</h2>

          <p style={styles.desc}>
            {isDev
              ? '開發模式：請查看下方錯誤詳情'
              : '我們已收到錯誤通知，請稍後再試或重新載入頁面。'}
          </p>

          {isDev && error && (
            <div style={styles.errorBox}>
              <p style={styles.errorMessage}>{error.toString()}</p>
              {errorInfo && (
                <pre style={styles.errorStack}>
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div style={styles.btnRow}>
            <button
              onClick={() => window.location.reload()}
              className="btn-blue"
              style={styles.btn}
            >
              重新載入頁面
            </button>
            <button
              onClick={this.handleReset}
              style={{ ...styles.btn, ...styles.btnOutline }}
            >
              嘗試恢復
            </button>
            <a
              href="/"
              style={{ ...styles.btn, ...styles.btnLink }}
            >
              返回首頁
            </a>
          </div>
        </div>
      </div>
    )
  }
}

const styles = {
  page: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: 'var(--color-bg-light)',
  },
  card: {
    background: 'var(--color-bg-white)',
    borderRadius: 'var(--pet-border-radius)',
    boxShadow: '0 10px 40px var(--color-shadow-light)',
    border: '1px solid var(--color-gray-light)',
    padding: '48px 40px',
    maxWidth: 560,
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'var(--font-family-display)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--color-text-dark)',
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    color: 'var(--color-gray-dark)',
    lineHeight: 1.7,
    marginBottom: 20,
    maxWidth: 360,
  },
  errorBox: {
    width: '100%',
    background: '#1e1e2e',
    borderRadius: 10,
    padding: '16px',
    marginBottom: 24,
    textAlign: 'left',
    maxHeight: 240,
    overflowY: 'auto',
  },
  errorMessage: {
    color: '#f38ba8',
    fontSize: 13,
    fontFamily: 'ui-monospace, monospace',
    marginBottom: 8,
    wordBreak: 'break-all',
  },
  errorStack: {
    color: '#cdd6f4',
    fontSize: 11,
    fontFamily: 'ui-monospace, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btn: {
    padding: '10px 22px',
    borderRadius: 980,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 40,
    border: 'none',
  },
  btnOutline: {
    border: '1.5px solid var(--color-gray-light)',
    background: 'var(--color-bg-white)',
    color: 'var(--color-text-dark)',
  },
  btnLink: {
    color: 'var(--color-gray-dark)',
    background: 'transparent',
    textDecoration: 'underline',
    fontSize: 13,
  },
}

export default ErrorBoundary
