import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import axios from 'axios';

interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: number;
    username: string;
    role: string;
  };
}

interface AdminLoginProps {
  onLogin: (data: { token: string; admin: { id: number; username: string; role: string } }) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { code: string; password: string }) => {
    setLoading(true);
    try {
      const res = await axios.post<AdminLoginResponse>('http://localhost:3001/api/admin/login', values);
      if (res.data.success && res.data.token && res.data.admin) {
        message.success('登录成功');
        onLogin({ token: res.data.token, admin: res.data.admin });
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
          <Form.Item name="code" rules={[{ required: true, message: '请输入账号' }]}> 
            <Input placeholder="账号" autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
            <Button type="link" block onClick={onBack}>返回</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminLogin; 