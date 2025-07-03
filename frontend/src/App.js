import React, { useState } from 'react';
import Login from './pages/Login';
import Score from './pages/Score';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { Button } from 'antd';

function App() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  if (admin) {
    return <AdminDashboard admin={admin} onLogout={() => setAdmin(null)} />;
  }

  if (showAdminLogin) {
    return <AdminLogin onLogin={setAdmin} onBack={() => setShowAdminLogin(false)} />;
  }

  if (!user) {
    return <div>
      <div style={{ position: 'fixed', top: 0, right: 0, padding: 16, zIndex: 1000 }}>
        <Button
          type="default"
          style={{ background: '#fff', color: '#1976a1', fontWeight: 600, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          onClick={() => setShowAdminLogin(true)}
        >
          管理员登录
        </Button>
      </div>
      <Login onLogin={setUser} />
    </div>;
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: 24, right: 24, padding: 12, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <span style={{ marginRight: 16 }}>当前考核码：{user.code}（{user.name}）</span>
        <Button onClick={() => setUser(null)}>退出登录</Button>
      </div>
      <Score user={user} onExit={() => setUser(null)} cardPaddingTop={48} />
    </div>
  );
}

export default App;
