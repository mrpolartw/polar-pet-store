import { Navigate } from 'react-router-dom';

import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';

/**
 * @description 僅限未登入用戶訪問的路由（如登入、註冊頁）。
 * - 已登入：redirect 到首頁
 * - 未登入：正常 render children
 * - isLoading 中：直接 render children（避免已登入用戶看到登入頁閃爍）
 *
 * @param {{ children: import('react').ReactNode }} props
 * @returns {import('react').ReactNode}
 */
export default function PublicRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (!isLoading && isLoggedIn) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}
