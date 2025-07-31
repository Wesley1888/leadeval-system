import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Popconfirm, message, Tag, Select, Tabs, DatePicker } from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

interface Task {
  id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  description: string;
  status: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface TaskPerson {
  id: number;
  person_id: number;
  department_id: number;
  person_name: string;
  department_name: string;
  role?: string;
}
interface TaskDepartment {
  id: number;
  department_id: number;
  department_name: string;
}

const statusOptions = ['未开始', '进行中', '已完成'];

const ProjectTasks: React.FC = () => {
  const { admin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form] = Form.useForm();

  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotTask, setSnapshotTask] = useState<Task | null>(null);
  const [persons, setPersons] = useState<TaskPerson[]>([]);
  const [departments, setDepartments] = useState<TaskDepartment[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/task`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setTasks(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取考核任务失败');
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
    form.setFieldsValue({ created_by: admin?.id, status: 1 });
    setModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditing(task);
    form.setFieldsValue({
      ...task,
      start_date: task.start_date ? dayjs(task.start_date) : null,
      end_date: task.end_date ? dayjs(task.end_date) : null
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/task/${id}`, {
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
      return;
    }
    // 日期转字符串
    if (values.start_date) values.start_date = values.start_date.format('YYYY-MM-DD');
    if (values.end_date) values.end_date = values.end_date.format('YYYY-MM-DD');
    try {
      if (editing) {
        await axios.put(`${API_BASE}/api/admin/task/${editing.id}`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('修改成功');
      } else {
        values.created_by = admin?.id;
        await axios.post(`${API_BASE}/api/admin/task`, values, {
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

  const handleViewSnapshot = async (task: Task) => {
    setSnapshotTask(task);
    setSnapshotModalOpen(true);
    setSnapshotLoading(true);
    try {
      const [personRes, deptRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/task/${task.id}/persons`, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        }),
        axios.get(`${API_BASE}/api/admin/task/${task.id}/departments`, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        })
      ]);
      setPersons(personRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (err: any) {
      message.error('获取快照失败');
    } finally {
      setSnapshotLoading(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '年度', dataIndex: 'year', key: 'year', width: 80 },
    {
      title: '时间范围',
      key: 'date_range',
      width: 180,
      render: (_: any, record: Task) =>
        `${dayjs(record.start_date).format('YYYY-MM-DD')} ~ ${dayjs(record.end_date).format('YYYY-MM-DD')}`
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: number) => {
        let color = 'default';
        if (status === 3) color = 'green';
        else if (status === 2) color = 'blue';
        else if (status === 1) color = 'orange';
        return <Tag color={color}>{status === 1 ? '未开始' : status === 2 ? '进行中' : '已完成'}</Tag>;
      }
    },
    { title: '描述', dataIndex: 'description', key: 'description', width: 220, ellipsis: true },
    { title: '创建人', dataIndex: 'created_by', key: 'created_by', width: 100 },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 140,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Task) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)} disabled={record.status === 3}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
          <Button size="small" onClick={() => handleViewSnapshot(record)}>查看快照</Button>
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
        pagination={{ 
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          size: 'default'
        }}
        scroll={{ x: 1200 }}
      />
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleOk} title={editing ? '编辑任务' : '添加任务'}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="year" label="年度" rules={[{ required: true, message: '请输入年度' }]}> 
            <Input type="number" />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}> 
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期" rules={[{ required: true, message: '请选择结束日期' }]}> 
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}> 
            <Select>
              <Select.Option value={1}>未开始</Select.Option>
              <Select.Option value={2}>进行中</Select.Option>
              <Select.Option value={3}>已完成</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述"> 
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="created_by" label="创建人ID" hidden>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal open={snapshotModalOpen} onCancel={() => setSnapshotModalOpen(false)} footer={null} title={snapshotTask ? `任务“${snapshotTask.name}”参与快照` : '快照'} width={900}>
        <Tabs defaultActiveKey="persons" items={[{
          key: 'persons',
          label: '人员快照',
          children: <Table
            rowKey="id"
            columns={[
              { title: '姓名', dataIndex: 'person_name', key: 'person_name' },
              { title: '部门', dataIndex: 'department_name', key: 'department_name' },
              { title: '职务', dataIndex: 'role', key: 'role' }
            ]}
            dataSource={persons}
            loading={snapshotLoading}
            pagination={{ 
              pageSize: 50,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              size: 'small'
            }}
            size="small"
          />
        }, {
          key: 'departments',
          label: '部门快照',
          children: <Table
            rowKey="id"
            columns={[
              { title: '部门名称', dataIndex: 'department_name', key: 'department_name' }
            ]}
            dataSource={departments}
            loading={snapshotLoading}
            pagination={{ 
              pageSize: 50,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              size: 'small'
            }}
            size="small"
          />
        }]} />
      </Modal>
    </Card>
  );
};

export default ProjectTasks; 