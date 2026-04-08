import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ROUTES } from '../constants/routes';

/**
 * @description 無權限頁面：用戶已登入但無權訪問特定資源時顯示。
 */
export default function Unauthorized() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        fontFamily: 'var(--font-family-base)',
        color: 'var(--color-text-dark)',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-light)',
          color: 'var(--color-brand-blue)',
          marginBottom: 24,
        }}
      >
        <ShieldOff size={64} />
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'var(--font-family-display)',
          marginBottom: 12,
        }}
      >
        您沒有權限訪問此頁面
      </h1>
      <p
        style={{
          fontSize: 16,
          color: 'var(--color-gray-dark)',
          lineHeight: 1.7,
          maxWidth: 420,
          marginBottom: 32,
        }}
      >
        請確認您已登入正確帳號，或聯絡客服取得協助。
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to={ROUTES.HOME}
          className="btn-blue"
          style={{
            padding: '12px 28px',
            borderRadius: 980,
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          返回首頁
        </Link>
        <Link
          to={ROUTES.LOGIN}
          className="btn-blue"
          style={{
            padding: '12px 28px',
            borderRadius: 980,
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 600,
            border: '1.5px solid var(--color-gray-light)',
            color: 'var(--color-text-dark)',
            background: 'var(--color-bg-white)',
          }}
        >
          前往登入
        </Link>
      </div>
    </main>
  );
}
