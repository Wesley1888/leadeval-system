import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  ApartmentOutlined,
  UserOutlined,
  KeyOutlined
} from '@ant-design/icons';
import DepartmentManager from './DepartmentManager';
import PersonManager from './PersonManager';
import CodeManager from './CodeManager';
import ProjectTasks from './ProjectTasks';
import DatabaseManager from './DatabaseManager';

const { Sider, Content } = Layout;

const AdminPanel: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('department');

  let content;
  if (selectedKey === 'department') {
    content = <DepartmentManager />;
  } else if (selectedKey === 'person') {
    content = <PersonManager />;
  } else if (selectedKey === 'code') {
    content = <CodeManager />;
  } else if (selectedKey === 'project-tasks') {
    content = <ProjectTasks />;
  } else if (selectedKey === 'database') {
    content = <DatabaseManager />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ height: '100%', borderRight: 0 }}
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