import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Login';
import Score from '../pages/Score';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  const { user, admin } = useAuth();

  return (
    <Routes>
      {/* 根路径重定向 */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/score" replace /> :
          admin ? <Navigate to="/admin/dashboard" replace /> :
          <Navigate to="/login" replace />
        } 
      />

      {/* 用户登录页面 */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/score" replace /> :
          <Login />
        } 
      />

      {/* 用户评分页面 - 需要用户认证 */}
      <Route 
        path="/score" 
        element={
          <ProtectedRoute requireUser={true}>
            <Score />
          </ProtectedRoute>
        } 
      />

      {/* 管理员登录页面 */}
      <Route 
        path="/admin/login" 
        element={
          admin ? <Navigate to="/admin/dashboard" replace /> :
          <AdminLogin />
        } 
      />

      {/* 管理员仪表板 - 需要管理员认证 */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* 404 页面 - 重定向到登录 */}
      <Route 
        path="*" 
        element={<Navigate to="/login" replace />} 
      />
    </Routes>
  );
}; 