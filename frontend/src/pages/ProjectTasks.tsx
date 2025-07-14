import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Popconfirm, message, Tag, Select } from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: number;
  name: string;
  description: string;
  status: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

const statusOptions = ['未开始', '进行中', '已完成'];

const ProjectTasks: React.FC = () => {
  const { admin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form] = Form.useForm();

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/task`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      const tasksData = res.data.data || [];
      
      // 按时间排序，进行中的任务排在最前面
      const sortedTasks = tasksData.sort((a: Task, b: Task) => {
        // 首先按状态排序：进行中的任务在前，未开始的任务在中间，已完成的任务在后
        const statusOrder = { '进行中': 0, '未开始': 1, '已完成': 2 };
        const statusA = statusOrder[a.status as keyof typeof statusOrder] || 0;
        const statusB = statusOrder[b.status as keyof typeof statusOrder] || 0;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // 状态相同时，按更新时间倒序排列（最新的在前）
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      
      setTasks(sortedTasks);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取任务失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchTasks();
    // eslint-disable-next-line
  }, [admin]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ owner: admin?.name, status: '未开始' });
    setModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditing(task);
    form.setFieldsValue(task);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/api/task/${id}`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      message.success('已删除');
      fetchTasks();
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleOk = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      // 校验失败，表单会自动高亮错误，不需要额外提示
      return;
    }
    try {
      if (editing) {
        // 编辑时，负责人改为当前管理员
        values.owner = admin?.name;
        await axios.put(`${API_BASE}/api/task/${editing.id}`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('修改成功');
      } else {
        await axios.post(`${API_BASE}/api/task`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '描述', dataIndex: 'description', key: 'description', width: 220, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        if (status === '已完成') color = 'green';
        else if (status === '进行中') color = 'blue';
        else if (status === '未开始') color = 'orange';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { 
      title: '更新时间', 
      dataIndex: 'updated_at', 
      key: 'updated_at', 
      width: 140,
      render: (updated_at: string, record: Task) => {
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        };
        return (
          <Space>
            <span>{formatDate(updated_at)}</span>
            <Tag color="purple">{record.owner}</Tag>
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Task) => (
        <Space>
          <Button 
            size="small" 
            onClick={() => handleEdit(record)}
            disabled={record.status === '已完成'}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card title="项目任务管理" extra={<Button type="primary" onClick={handleAdd}>添加任务</Button>}>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={{ pageSize: 50 }}
        scroll={{ x: 1200 }}
      />
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleOk} title={editing ? '编辑任务' : '添加任务'}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}> 
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}> 
            <Select>
              {statusOptions.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}> 
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ProjectTasks; 