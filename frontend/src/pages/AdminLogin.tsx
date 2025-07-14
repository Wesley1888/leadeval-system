import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

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
        const adminData = {
          token: res.data.token,
          name: res.data.admin.name,
        };
        setAdmin(adminData);
        const from = location.state?.from?.pathname || '/admin/panel';
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      padding: 0,
      overflow: 'auto',
      position: 'relative'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(25, 118, 210, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(66, 165, 245, 0.3) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 480,
        width: '100%',
        padding: '0 20px',
        zIndex: 1
      }}>
        {/* 标题区域 */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
          animation: 'fadeInDown 0.8s ease-out'
        }}>
          <Title level={1} style={{
            color: '#fff',
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            lineHeight: 1.4
          }}>
            管理员登录
          </Title>
          <Title level={2} style={{
            color: '#fff',
            margin: '8px 0 0 0',
            fontSize: 20,
            fontWeight: 500,
            opacity: 0.9,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            中煤平朔集团有限公司
          </Title>
        </div>
        {/* 登录卡片 */}
        <Card
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeInUp 0.8s ease-out 0.2s both'
          }}
          bodyStyle={{ padding: 40 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)'
            }}>
              <UserOutlined style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#333', fontWeight: 600 }}>
              管理员账号登录
            </Title>
            <Text style={{ color: '#666', fontSize: 14 }}>
              请输入管理员账号和密码
            </Text>
          </div>
          <Form onFinish={onFinish} layout="vertical">
            <Form.Item name="name" rules={[{ required: true, message: '请输入账号' }]}> 
              <Input 
                prefix={<UserOutlined style={{ color: '#ccc' }} />} 
                placeholder="账号" 
                autoFocus 
                size="large" 
                style={{
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.3s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#1976d2';
                  e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e8e8e8';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> 
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#ccc' }} />} 
                placeholder="密码" 
                size="large" 
                style={{
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.3s'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#1976d2';
                  e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e8e8e8';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading} 
                size="large" 
                style={{
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(25, 118, 210, 0.3)';
                }}
              >
                登录
              </Button>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                block 
                style={{
                  marginTop: 12,
                  color: '#1976d2',
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 8,
                  background: 'rgba(25, 118, 210, 0.08)'
                }}
                onClick={() => navigate('/login')}
              >
                返回用户登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
      {/* 添加CSS动画 */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin; 