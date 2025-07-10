import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';
import Login from '../pages/Login';
import Score from '../pages/Score';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import DatabaseManager from '../pages/DatabaseManager';
import ProjectTasks from '../pages/ProjectTasks';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  const { user, admin, loading } = useAuth();

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

      {/* 数据库管理页面 - 需要管理员认证 */}
      <Route 
        path="/admin/database" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <DatabaseManager />
          </ProtectedRoute>
        } 
      />

      {/* 项目任务协同管理页面 - 需要管理员认证 */}
      <Route 
        path="/admin/project-tasks" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <ProjectTasks />
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