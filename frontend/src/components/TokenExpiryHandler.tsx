import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface TokenExpiryHandlerProps {
  children: React.ReactNode;
}

const TokenExpiryHandler: React.FC<TokenExpiryHandlerProps> = ({ children }) => {
  const { user, admin, checkTokenExpiry } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 检查当前页面是否需要认证
    const isProtectedRoute = !location.pathname.includes('/login') && 
                            !location.pathname.includes('/admin/login') &&
                            location.pathname !== '/';

    if (isProtectedRoute) {
      // 如果没有认证信息，直接跳转到登录页
      if (!user && !admin) {
        if (location.pathname.startsWith('/admin')) {
          navigate('/admin/login', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
        return;
      }

      // 检查token是否过期
      if (checkTokenExpiry()) {
        if (location.pathname.startsWith('/admin')) {
          navigate('/admin/login', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    }
  }, [user, admin, location.pathname, checkTokenExpiry, navigate]);

  return <>{children}</>;
};

export default TokenExpiryHandler; 