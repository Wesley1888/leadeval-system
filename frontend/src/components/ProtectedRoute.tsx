import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireUser?: boolean;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireUser = false, 
  requireAdmin = false 
}) => {
  const { user, admin, loading, checkTokenExpiry } = useAuth();
  const location = useLocation();

  // 如果还在加载中，显示加载指示器
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f7fa'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 如果不需要认证，直接渲染
  if (!requireUser && !requireAdmin) {
    return <>{children}</>;
  }

  // 检查token是否过期
  if (checkTokenExpiry()) {
    if (requireAdmin) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // 如果需要用户认证但没有用户
  if (requireUser && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果需要管理员认证但没有管理员
  if (requireAdmin && !admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 如果已认证，渲染子组件
  return <>{children}</>;
}; 