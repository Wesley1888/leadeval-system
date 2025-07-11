import React, { useState } from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import {
  ApartmentOutlined,
  UserOutlined,
  KeyOutlined,
  BarChartOutlined,
  LogoutOutlined,
  PercentageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
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

const { Header, Sider, Content } = Layout;

const AdminPanel: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('department');
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  let content;
  if (selectedKey === 'department') {
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
            onClick={({ key }) => setSelectedKey(key as string)}
            items={[
              {
                key: 'department',
                icon: <ApartmentOutlined />, 
                label: '部门管理',
              },
              {
                key: 'person',
                icon: <UserOutlined />, 
                label: '被考核人管理',
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