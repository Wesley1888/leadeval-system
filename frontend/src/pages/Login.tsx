import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Modal, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, LockOutlined, InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [noticeVisible, setNoticeVisible] = useState<boolean>(false);
  const [helpVisible, setHelpVisible] = useState<boolean>(false);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const onFinish = async (values: { code: string }) => {
    setLoading(true);
    try {
      const res = await axios.post<any>(`${API_BASE}/api/login`, { code: values.code });
      message.success('登录成功');
      setUser({ 
        code: res.data.user.code, 
        department_id: res.data.user.department_id,
        token: res.data.token || res.data.user.token // 保存token
      });
      // 如果有重定向路径，则导航到该路径，否则导航到评分页面
      const from = location.state?.from?.pathname || '/score';
      navigate(from, { replace: true });
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
      
      {/* 左上角按钮 */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        padding: 20, 
        zIndex: 1000,
        display: 'flex',
        gap: 16
      }}>
        <Button 
          type="text" 
          icon={<InfoCircleOutlined />}
          style={{ 
            color: '#fff', 
            fontWeight: 600,
            fontSize: 14,
            height: 'auto',
            padding: '8px 12px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }} 
          onClick={() => setNoticeVisible(true)}
        >
          考核通知
        </Button>
        <Button 
          type="text" 
          icon={<QuestionCircleOutlined />}
          style={{ 
            color: '#fff', 
            fontWeight: 600,
            fontSize: 14,
            height: 'auto',
            padding: '8px 12px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }} 
          onClick={() => setHelpVisible(true)}
        >
          使用说明
        </Button>
      </div>
      
      {/* 右上角管理员登录按钮 */}
      <div style={{ position: 'fixed', top: 0, right: 0, padding: 20, zIndex: 1000 }}>
        <Button
          type="default"
          icon={<UserOutlined />}
          style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            color: '#1976d2', 
            fontWeight: 600, 
            border: 'none', 
            borderRadius: 20,
            padding: '8px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => navigate('/admin/login')}
        >
          管理员登录
        </Button>
      </div>

      {/* 主要内容区域 */}
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
            中煤平朔集团有限公司
          </Title>
          <Title level={2} style={{ 
            color: '#fff', 
            margin: '8px 0 0 0', 
            fontSize: 24,
            fontWeight: 500,
            opacity: 0.9,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            中层管理人员考核系统
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
              <LockOutlined style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#333', fontWeight: 600 }}>
              请输入考核码
            </Title>
            <Text style={{ color: '#666', fontSize: 14 }}>
              请输入8位考核码进行身份验证
            </Text>
          </div>

          <Form onFinish={onFinish} layout="vertical">
            <Form.Item 
              name="code" 
              rules={[
                { required: true, message: '请输入考核码' }, 
                { len: 8, message: '考核码为8位' }
              ]}
            >
              <Input 
                prefix={<LockOutlined style={{ color: '#ccc' }} />}
                maxLength={8} 
                placeholder="请输入8位考核码" 
                autoFocus 
                size="large" 
                style={{ 
                  borderRadius: 8, 
                  height: 48,
                  fontSize: 16,
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1976d2';
                  e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)';
                }}
                onBlur={(e) => {
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(25, 118, 210, 0.3)';
                }}
              >
                登录系统
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      {/* 弹窗内容 */}
      <Modal 
        open={noticeVisible} 
        onCancel={() => setNoticeVisible(false)} 
        footer={null} 
        title="考核通知"
        centered
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <Text>
            这里是考核通知内容，可在此处填写具体通知信息。包括考核时间、考核要求、注意事项等重要信息。
          </Text>
        </div>
      </Modal>
      
      <Modal 
        open={helpVisible} 
        onCancel={() => setHelpVisible(false)} 
        footer={null} 
        title="使用说明"
        centered
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong>1. 身份验证</Text><br />
            <Text>输入8位考核码登录系统。</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>2. 评分操作</Text><br />
            <Text>登录后为本单位所有人员打分。</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>3. 分数输入</Text><br />
            <Text>每项分数可手动输入或快捷选择。</Text>
          </div>
          <div>
            <Text strong>4. 提交完成</Text><br />
            <Text>打分完成后点击提交。</Text>
          </div>
        </div>
      </Modal>

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

export default Login; 