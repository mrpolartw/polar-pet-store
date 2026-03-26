import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { SEOHead } from '../../components/common'
import { ROUTES } from '../../constants/routes'
import './ServerError.css'

export default function ServerError({ statusCode = 500, message }) {
  const isDev = import.meta.env.DEV

  return (
    <main className="server-error-page">
      <SEOHead title="系統錯誤" noIndex={true} />

      <div className="server-error-card">
        <div className="server-error-icon">
          <AlertTriangle size={36} strokeWidth={1.5} />
        </div>

        <h1 className="server-error-title">系統暫時無法服務</h1>

        <p className="server-error-desc">
          我們已收到通知，正在盡快修復中。<br />
          請稍後再試，或透過客服與我們聯繫。
        </p>

        <div className="server-error-actions">
          <button
            className="btn-blue"
            onClick={() => window.location.reload()}
          >
            重新整理
          </button>
          <Link to={ROUTES.HOME} className="btn-outline">
            回首頁
          </Link>
          <Link to={ROUTES.CONTACT} className="btn-ghost">
            聯絡客服
          </Link>
        </div>

        <p className="server-error-code">
          Error {statusCode}
          {isDev && message ? ` — ${message}` : ''}
        </p>
      </div>
    </main>
  )
}
