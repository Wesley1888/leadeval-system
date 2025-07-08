import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, admin } = useAuth();
  const location = useLocation();

  // 如果不需要认证，直接渲染
  if (!requireUser && !requireAdmin) {
    return <>{children}</>;
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