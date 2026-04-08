import { Navigate, useLocation } from 'react-router-dom';

import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';

/**
 * @description 保護需要登入才能訪問的路由。
 * - isLoading 中：顯示全頁 Loading（避免 auth 初始化前閃爍跳轉）
 * - 未登入：redirect 到 /login，並在 state 記錄來源頁 { from: location.pathname }
 * - 已登入：正常 render children
 *
 * @param {{ children: import('react').ReactNode }} props
 * @returns {import('react').ReactNode}
 */
export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-white)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--color-gray-light)',
            borderTopColor: 'var(--color-brand-blue)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  return children;
}
