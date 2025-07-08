import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [noticeVisible, setNoticeVisible] = useState<boolean>(false);
  const [helpVisible, setHelpVisible] = useState<boolean>(false);

  const onFinish = async (values: { code: string }) => {
    setLoading(true);
    try {
      const res = await axios.post<any>('http://localhost:3001/api/login', { code: values.code });
      const year = new Date().getFullYear() + 1;
      const check = await axios.get<{ finished: boolean }>('http://localhost:3001/api/score/finished', { params: { code: res.data.user.code, year } });
      if (check.data.finished) {
        message.warning('您已完成全部打分，无法再次进入。');
        setLoading(false);
        return;
      }
      message.success('登录成功');
      setUser({ code: res.data.user.code, department: res.data.user.department });
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
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#1976a1',
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* 左上角按钮 */}
      <div style={{ position: 'fixed', top: 0, left: 0, padding: 16, zIndex: 1000 }}>
        <Button type="link" style={{ color: '#fff', fontWeight: 600 }} onClick={() => setNoticeVisible(true)}>考核通知</Button>
        <Button type="link" style={{ color: '#fff', fontWeight: 600 }} onClick={() => setHelpVisible(true)}>使用说明</Button>
      </div>
      {/* 右上角管理员登录按钮 */}
      <div style={{ position: 'fixed', top: 0, right: 0, padding: 16, zIndex: 1000 }}>
        <Button
          type="default"
          style={{ background: '#fff', color: '#1976a1', fontWeight: 600, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          onClick={() => navigate('/admin/login')}
        >
          管理员登录
        </Button>
      </div>
      <div style={{
        color: '#fff',
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 1.3,
        maxWidth: 320
      }}>
        中煤平朔集团有限公司<br />中层管理人员考核系统
      </div>
      <Card style={{ width: '100%', maxWidth: 350, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>请输入8位考核码</h2>
        <Form onFinish={onFinish}>
          <Form.Item name="code" rules={[{ required: true, message: '请输入考核码' }, { len: 8, message: '考核码为8位' }]}>
            <Input maxLength={8} placeholder="8位考核码" autoFocus size="large" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} size="large" style={{ borderRadius: 8 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
      {/* 弹窗内容可自定义 */}
      <Modal open={noticeVisible} onCancel={() => setNoticeVisible(false)} footer={null} title="考核通知">
        <p>这里是考核通知内容，可在此处填写具体通知信息。</p>
      </Modal>
      <Modal open={helpVisible} onCancel={() => setHelpVisible(false)} footer={null} title="使用说明">
        <p>1. 输入8位考核码登录系统。<br/>2. 登录后为本单位所有人员打分。<br/>3. 每项分数可手动输入或快捷选择。<br/>4. 打分完成后点击提交。</p>
      </Modal>
    </div>
  );
};

export default Login; 