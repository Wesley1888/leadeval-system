import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Card, List, Typography, Row, Col, Statistic, Dropdown } from 'antd';
import {
  ApartmentOutlined,
  UserOutlined,
  KeyOutlined,
  BarChartOutlined,
  LogoutOutlined,
  PercentageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  BellOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DepartmentManager from './DepartmentManager';
import PersonManager from './PersonManager';
import CodeManager from './CodeManager';
import WeightManager from './WeightManager';
import ProjectTasks from './ProjectTasks';
import DatabaseManager from './DatabaseManager';
import StatResult from './StatResult';
import axios from 'axios';
import { message } from 'antd';

const { Header, Sider, Content } = Layout;

const AdminPanel: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKey(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Dashboard数据示例（实际可用useEffect+接口获取）
  const [dashboardStats, setDashboardStats] = useState({
    department: 0,
    person: 0,
    task: 0,
    todo: 0
  });
  const [recentLogs, setRecentLogs] = useState<string[]>([]);

  useEffect(() => {
    // 获取真实统计数据
    const fetchStats = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
        const [deptRes, personRes, taskRes] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/department`, { headers: { Authorization: `Bearer ${admin?.token}` } }),
          axios.get(`${API_BASE}/api/admin/person`, { headers: { Authorization: `Bearer ${admin?.token}` } }),
          axios.get(`${API_BASE}/api/task`, { headers: { Authorization: `Bearer ${admin?.token}` } })
        ]);
        const department = deptRes.data.total || deptRes.data.data?.length || 0;
        const person = personRes.data.total || personRes.data.data?.length || 0;
        const taskList = taskRes.data.data || [];
        const task = taskRes.data.total || taskList.length;
        const todo = taskList.filter((t: any) => t.status !== '已完成').length;
        setDashboardStats({ department, person, task, todo });
      } catch {
        setDashboardStats({ department: 0, person: 0, task: 0, todo: 0 });
      }
    };
    fetchStats();
    setRecentLogs([
      '2024-06-01 09:00 添加任务“年度考核”',
      '2024-06-01 08:30 部门“技术服务公司”信息更新',
      '2024-05-31 17:20 完成任务“安全培训”',
      '2024-05-31 16:00 新增人员“张三”',
    ]);
  }, []);

  // 复用统计结果页面的导出Excel逻辑
  const handleExport = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      const params: any = { year: new Date().getFullYear() + 1 };
      const res = await axios.get(`${API_BASE}/api/score/export`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'scores.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('导出失败');
    }
  };

  let content;
  if (selectedKey === 'dashboard') {
    content = (
      <>
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="部门数" value={dashboardStats.department} prefix={<ApartmentOutlined />} /></Card></Col>
          <Col span={6}><Card><Statistic title="人员数" value={dashboardStats.person} prefix={<UserOutlined />} /></Card></Col>
          <Col span={6}><Card><Statistic title="任务数" value={dashboardStats.task} prefix={<ProjectOutlined />} /></Card></Col>
          <Col span={6}><Card><Statistic title="待办事项" value={dashboardStats.todo} prefix={<BellOutlined />} /></Card></Col>
        </Row>
        {/* 快捷操作区 */}
        <Card style={{ marginTop: 24 }} bodyStyle={{ padding: 16 }}>
          <Space>
            <Button type="primary" onClick={() => setSelectedKey('project-tasks')}>添加任务</Button>
            <Button onClick={() => setSelectedKey('stat')}>查看统计</Button>
            <Button onClick={handleExport} type="default">导出数据</Button>
          </Space>
        </Card>
        <Card style={{ marginTop: 24 }} title="最近动态">
          <List dataSource={recentLogs} renderItem={item => <List.Item>{item}</List.Item>} />
        </Card>
        <Typography.Paragraph style={{ marginTop: 24 }}>
          欢迎使用 <b style={{ color: '#1677ff' }}>管理后台</b>！如有疑问请联系系统管理员。
        </Typography.Paragraph>
      </>
    );
  } else if (selectedKey === 'department') {
    content = <DepartmentManager />;
  } else if (selectedKey === 'person') {
    content = <PersonManager />;
  } else if (selectedKey === 'code') {
    content = <CodeManager />;
  } else if (selectedKey === 'weight') {
    content = <WeightManager />;
  } else if (selectedKey === 'stat') {
    content = <StatResult />;
  } else if (selectedKey === 'project-tasks') {
    content = <ProjectTasks />;
  } else if (selectedKey === 'database') {
    content = <DatabaseManager />;
  }

  return (
    <Layout style={{ minHeight: '100vh', height: '100vh' }}>
      {/* 顶部全局Header */}
      <Header style={{ background: '#fff', height: 56, lineHeight: '56px', padding: '0 32px', boxShadow: '0 2px 8px #f0f1f2', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1677ff', letterSpacing: 2 }}>管理后台</span>
          <Space>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>管理员：{admin?.name}</span>
            <Button 
              type="text" 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              style={{ padding: 0, height: 'auto' }}
            >
              退出登录
            </Button>
          </Space>
        </div>
      </Header>
      <Layout style={{ marginTop: 56 }}>
        <Sider
          width={200}
          collapsedWidth={80}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />}
            </span>
          }
          style={{ background: '#fff', height: 'calc(100vh - 56px)', position: 'fixed', left: 0, top: 56, zIndex: 10 }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: 'calc(100% - 80px)', borderRight: 0 }}
            onClick={handleMenuClick}
            items={[
              {
                key: 'dashboard',
                icon: <HomeOutlined />,
                label: '首页总览',
              },
              {
                key: 'department',
                icon: <ApartmentOutlined />, 
                label: '部门管理',
              },
              {
                key: 'person',
                icon: <UserOutlined />, 
                label: '人员管理',
              },
              {
                key: 'code',
                icon: <KeyOutlined />, 
                label: '考核码管理',
              },
              {
                key: 'weight',
                icon: <PercentageOutlined />, 
                label: '权重管理',
              },
              {
                key: 'stat',
                icon: <BarChartOutlined />, 
                label: '统计结果',
              },
              {
                key: 'project-tasks',
                icon: <span style={{fontSize:16}}>📋</span>,
                label: '项目任务管理',
              },
              {
                key: 'database',
                icon: <span style={{fontSize:16}}>🗄️</span>,
                label: '数据库管理',
              },
            ]}
          />
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 200, minHeight: 'calc(100vh - 56px)' }}>
          <Content style={{ background: '#fff', padding: 24, minHeight: 600, height: '100%', overflow: 'auto' }}>
            {content}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminPanel; 