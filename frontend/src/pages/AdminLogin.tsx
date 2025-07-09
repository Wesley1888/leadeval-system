import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: number;
    name: string;
    role: string;
  };
}

const AdminLogin: React.FC = () => {
  const { setAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { name: string; password: string }) => {
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      const res = await axios.post<AdminLoginResponse>(`${API_BASE}/api/admin/login`, values);
      if (res.data.success && res.data.token && res.data.admin) {
        message.success('登录成功');
        setAdmin({
          token: res.data.token,
          name: res.data.admin.name,
          code: res.data.admin.id.toString(),
        });
        // 如果有重定向路径，则导航到该路径，否则导航到管理员仪表板
        const from = location.state?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      } else {
        message.error(res.data.message || '登录失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1976a1' }}>
      <Card style={{ width: 350 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>管理员登录</h2>
        <Form onFinish={onFinish}>
          <Form.Item name="name" rules={[{ required: true, message: '请输入账号' }]}> 
            <Input placeholder="账号" autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
            <Button type="link" block onClick={() => navigate('/login')}>返回</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminLogin; 