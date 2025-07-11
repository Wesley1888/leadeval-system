import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Popconfirm, message } from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: number;
  name: string;
}

const DepartmentManager: React.FC = () => {
  const { admin } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/department`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setDepartments(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取部门失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchDepartments();
    // eslint-disable-next-line
  }, [admin]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditing(dept);
    form.setFieldsValue(dept);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/department/${id}`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      message.success('已删除');
      fetchDepartments();
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await axios.put(`${API_BASE}/api/admin/department/${editing.id}`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('修改成功');
      } else {
        await axios.post(`${API_BASE}/api/admin/department`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: '部门ID', dataIndex: 'id', key: 'id' },
    { title: '部门名称', dataIndex: 'name', key: 'name' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Department) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card title="部门管理" extra={<Button type="primary" onClick={handleAdd}>添加部门</Button>}>
      <Table rowKey="id" columns={columns} dataSource={departments} loading={loading} pagination={false} />
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleOk} title={editing ? '编辑部门' : '添加部门'}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}> 
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentManager; 