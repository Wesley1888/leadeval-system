import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, SaveOutlined, CloseOutlined, EditOutlined, DeleteOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons';

interface Task {
  id: number;
  title: string;
  owner: string;
  status: string;
  desc?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminOption {
  id: number;
  name: string;
  role: string;
}

const statusColors: Record<string, string> = {
  '未开始': 'default',
  '进行中': 'processing',
  '已完成': 'success',
  '已暂停': 'warning',
};

const statusOptions = [
  { value: '未开始', label: '未开始' },
  { value: '进行中', label: '进行中' },
  { value: '已完成', label: '已完成' },
  { value: '已暂停', label: '已暂停' },
];

// 格式化时间显示
const formatTime = (timeStr?: string) => {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ProjectTasks: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<Partial<Task>>({});
  const [form] = Form.useForm();
  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({});

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/task`, {
        headers: { Authorization: `Bearer ${admin!.token}` }
      });
      // 按创建时间排序，最新的在前面
      const sortedTasks = res.data.tasks.sort((a: Task, b: Task) => {
        if (!a.created_at && !b.created_at) return 0;
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setTasks(sortedTasks);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/list`, {
        headers: { Authorization: `Bearer ${admin!.token}` }
      });
      setAdminOptions(res.data.admins);
    } catch (error) {
      setAdminOptions([]);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchTasks();
      fetchAdmins();
    }
    // eslint-disable-next-line
  }, [admin]);

  useEffect(() => {
    if (modalOpen && !editingId && adminOptions.length > 0 && admin?.name) {
      form.setFieldsValue({ owner: admin.name });
    }
  }, [modalOpen, editingId, adminOptions, admin, form]);

  const handleAdd = () => {
    setAdding(true);
    setNewTask({
      title: '',
      owner: admin?.name || '',
      status: '未开始',
      desc: ''
    });
  };
  
  const handleAddChange = (key: keyof Task, value: any) => {
    setNewTask(prev => ({ ...prev, [key]: value }));
  };
  
  const handleAddSave = async () => {
    if (!newTask.title || !newTask.owner || !newTask.status) {
      message.warning('请填写完整信息');
      return;
    }
    try {
      await axios.post(`${API_BASE}/api/task/add`, newTask, {
        headers: { Authorization: `Bearer ${admin!.token}` }
      });
      message.success('添加成功');
      setAdding(false);
      setNewTask({});
      fetchTasks();
    } catch (error) {
      message.error('添加失败');
    }
  };
  
  const handleAddCancel = () => {
    setAdding(false);
    setNewTask({});
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTask({ ...task });
    setAdding(false);
  };
  
  const handleEditChange = (key: keyof Task, value: any) => {
    setEditTask(prev => ({ ...prev, [key]: value }));
  };
  
  const handleEditSave = async () => {
    if (!editTask.title || !editTask.status) {
      message.warning('请填写完整信息');
      return;
    }
    try {
      // 编辑保存时，负责人改为当前编辑的管理员
      const updatedTask = { ...editTask, owner: admin!.name };
      await axios.post(`${API_BASE}/api/task/update`, updatedTask, {
        headers: { Authorization: `Bearer ${admin!.token}` }
      });
      message.success('修改成功');
      setEditingId(null);
      setEditTask({});
      fetchTasks();
    } catch (error) {
      message.error('修改失败');
    }
  };
  
  const handleEditCancel = () => {
    setEditingId(null);
    setEditTask({});
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.post(`${API_BASE}/api/task/delete`, { id }, {
        headers: { Authorization: `Bearer ${admin!.token}` }
      });
      message.success('删除成功');
      fetchTasks();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await axios.post(`${API_BASE}/api/task/update`, { ...editTask, ...values }, {
          headers: { Authorization: `Bearer ${admin!.token}` }
        });
        message.success('修改成功');
      } else {
        await axios.post(`${API_BASE}/api/task/add`, values, {
          headers: { Authorization: `Bearer ${admin!.token}` }
        });
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      if (err.errorFields) {
        return;
      }
      message.error('操作失败');
    }
  };

  const handleNavigateToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!admin) {
    return <div style={{ padding: 50, textAlign: 'center' }}>
      <Card>请先登录管理员账号。</Card>
      <Button style={{ marginTop: 16 }} onClick={() => navigate('/admin/login')}>返回登录</Button>
    </div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', overflow: 'auto', padding: 24 }}>
      <style>{`
.project-task-table .ant-input,
.project-task-table .ant-btn {
  height: 40px !important;
  line-height: 40px !important;
  font-size: 16px !important;
  box-sizing: border-box;
  vertical-align: middle;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin: 0;
}
.project-task-table .ant-select-single .ant-select-selector {
  height: 40px !important;
  line-height: 40px !important;
  font-size: 16px !important;
  display: flex !important;
  align-items: center;
}
.project-task-table .ant-btn {
  padding-top: 0;
  padding-bottom: 0;
}
.project-task-table .ant-tag {
  font-size: 16px !important;
  height: 40px;
  line-height: 38px;
  display: inline-flex;
  align-items: center;
}
.project-task-table .project-task-cell {
  font-size: 16px;
  height: 40px;
  line-height: 40px;
  display: inline-block;
}
`}</style>
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>项目任务协同管理</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#666', marginRight: 16 }}>
                管理员：<span style={{ marginLeft: 8 }}>{admin.name}</span>
              </span>
            </div>
          </div>
        } 
        extra={
          <Space>
            <Button 
              icon={<DashboardOutlined />} 
              onClick={handleNavigateToDashboard}
              style={{ borderRadius: 8 }}
            >
              返回仪表盘
            </Button>
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              style={{ borderRadius: 8 }}
            >
              退出登录
            </Button>
            <Button onClick={fetchTasks}>刷新/同步</Button>
          </Space>
        } 
        style={{ maxWidth: 1200, margin: '0 auto' }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={adding || editingId !== null || adminOptions.length === 0}
            style={{ height: 40, fontSize: 16 }}
          >
            新建任务
          </Button>
        </Space>
        <Table
          className="project-task-table"
          rowKey="id"
          dataSource={adding ? [{ ...newTask, id: 'new' }, ...tasks] : tasks}
          loading={loading}
          bordered
          pagination={{ pageSize: 20 }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 60, fixed: 'left', render: (id, record) => id === 'new' ? '' : id },
            { title: '任务名称', dataIndex: 'title', width: 220, fixed: false, render: (text, record: any) => {
              if (record.id === 'new') {
                return <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
                  <Input
                    value={newTask.title}
                    onChange={e => handleAddChange('title', e.target.value)}
                    placeholder="请输入任务名称"
                    size="middle"
                    autoFocus
                    style={{ height: 40, fontSize: 16 }}
                  />
                </div>;
              }
              if (editingId === record.id) {
                return <Input value={editTask.title} onChange={e => handleEditChange('title', e.target.value)} size="small" autoFocus />;
              }
              return <span className="project-task-cell" style={{ 
                display: 'block', 
                width: '100%', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }} title={text}>{text}</span>;
            } },

            { title: '状态', dataIndex: 'status', width: 120, fixed: false, render: (text, record: any) => {
              if (record.id === 'new') {
                return <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
                  <Select 
                    value={newTask.status} 
                    onChange={v => handleAddChange('status', v)} 
                    options={statusOptions} 
                    style={{ width: '100%', height: 40, fontSize: 16 }}
                    size="middle"
                    placeholder="请选择状态" 
                  />
                </div>;
              }
              if (editingId === record.id) {
                return <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
                  <Select 
                    value={editTask.status} 
                    onChange={v => handleEditChange('status', v)} 
                    options={statusOptions} 
                    style={{ width: '100%', height: 40, fontSize: 16 }}
                    size="middle"
                    placeholder="请选择状态" 
                  />
                </div>;
              }
              return <div className="project-task-cell"><Tag color={statusColors[text] || 'default'}>{text}</Tag></div>;
            } },
            { title: '描述', dataIndex: 'desc', width: 200, fixed: false, render: (text, record: any) => {
              if (record.id === 'new') {
                return <Input value={newTask.desc} onChange={e => handleAddChange('desc', e.target.value)} placeholder="描述" size="small" />;
              }
              if (editingId === record.id) {
                return <Input value={editTask.desc} onChange={e => handleEditChange('desc', e.target.value)} size="small" />;
              }
              return <span className="project-task-cell" style={{ 
                display: 'block', 
                width: '100%', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }} title={text}>{text}</span>;
            } },
            { title: '最后编辑', dataIndex: 'updated_at', width: 200, fixed: false, render: (text, record: any) => {
              if (record.id === 'new') {
                return <span style={{ color: '#999' }}>保存后显示</span>;
              }
              // 根据管理员名称分配不同颜色
              const getOwnerColor = (owner: string) => {
                const colors = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'red', 'volcano', 'gold', 'lime'];
                // 取前三个字母，如果不够三个字母就用所有字母
                const key = owner.length >= 3 ? owner.substring(0, 3) : owner;
                // 计算字符串的哈希值
                let hash = 0;
                for (let i = 0; i < key.length; i++) {
                  hash = ((hash << 5) - hash) + key.charCodeAt(i);
                  hash = hash & hash; // 转换为32位整数
                }
                const index = Math.abs(hash) % colors.length;
                return colors[index];
              };

              return (
                <div className="project-task-cell" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  <span style={{ 
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{formatTime(text)}</span>
                  <Tag color={getOwnerColor(record.owner)} style={{ flexShrink: 0 }}>{record.owner}</Tag>
                </div>
              );
            } },
            {
              title: '操作',
              width: 160,
              fixed: 'right',
              render: (_, record: any) => {
                if (record.id === 'new') {
                  return <Space><Button size="middle" type="primary" icon={<SaveOutlined />} onClick={handleAddSave} style={{ height: 40, fontSize: 16, width: 70 }}>保存</Button><Button size="middle" icon={<CloseOutlined />} onClick={handleAddCancel} style={{ height: 40, fontSize: 16, width: 70 }}>取消</Button></Space>;
                }
                if (editingId === record.id) {
                  return <Space><Button size="middle" type="primary" icon={<SaveOutlined />} onClick={handleEditSave} style={{ height: 40, fontSize: 16, width: 70 }}>保存</Button><Button size="middle" icon={<CloseOutlined />} onClick={handleEditCancel} style={{ height: 40, fontSize: 16, width: 70 }}>取消</Button></Space>;
                }
                return <Space>
                  <Button size="middle" style={{ height: 40, fontSize: 16, width: 70 }} icon={<EditOutlined />} onClick={() => handleEdit(record)} disabled={adding || editingId !== null}>编辑</Button>
                  <Popconfirm title="确定删除此任务吗？" onConfirm={() => handleDelete(record.id)}>
                    <Button size="middle" style={{ height: 40, fontSize: 16, width: 70 }} icon={<DeleteOutlined />} danger>删除</Button>
                  </Popconfirm>
                </Space>;
              }
            }
          ]}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default ProjectTasks; 