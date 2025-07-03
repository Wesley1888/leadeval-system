import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import axios from 'axios';

const AdminLogin = ({ onLogin, onBack }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/admin/login', values);
      message.success('登录成功');
      onLogin(res.data);
    } catch (err) {
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