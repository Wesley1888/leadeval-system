import React, { useState } from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import {
  ApartmentOutlined,
  UserOutlined,
  KeyOutlined,
  BarChartOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DepartmentManager from './DepartmentManager';
import PersonManager from './PersonManager';
import CodeManager from './CodeManager';
import WeightManager from './WeightManager';
import ProjectTasks from './ProjectTasks';
import DatabaseManager from './DatabaseManager';

const { Sider, Content } = Layout;

const AdminPanel: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('department');
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

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
  } else if (selectedKey === 'project-tasks') {
    content = <ProjectTasks />;
  } else if (selectedKey === 'database') {
    content = <DatabaseManager />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
              管理员：{admin?.name}
            </div>
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
              icon: <BarChartOutlined />,
              label: '权重管理',
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
      <Layout style={{ padding: '24px' }}>
        <Content style={{ background: '#fff', padding: 24, minHeight: 600 }}>
          {content}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPanel; 