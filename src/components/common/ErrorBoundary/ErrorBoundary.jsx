import React from 'react'
import { Link } from 'react-router-dom'
import ROUTES from '../../../constants/routes'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    }
    // TODO BACKEND: 接入 Sentry / LogRocket
    // Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9f9f9',
          gap: 20,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f' }}>
            頁面發生錯誤
          </h2>
          <p style={{ fontSize: 15, color: '#6e6e73', maxWidth: 400 }}>
            很抱歉，系統發生了預期外的問題。請重新整理頁面，或返回首頁。
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              color: '#b91c1c',
              maxWidth: 600,
              overflow: 'auto',
              textAlign: 'left',
            }}>
              {this.state.error.toString()}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={this.handleReset}
              style={{
                background: '#003153',
                color: '#fff',
                border: 'none',
                borderRadius: 980,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              重新嘗試
            </button>
            <Link
              to={ROUTES.HOME}
              onClick={this.handleReset}
              style={{
                background: '#f3f4f6',
                color: '#1d1d1f',
                borderRadius: 980,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              返回首頁
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
