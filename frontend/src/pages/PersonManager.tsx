import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Popconfirm, Select, message } from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Person {
  id: number;
  name: string;
  department_id: number;
}
interface Department {
  id: number;
  name: string;
}

const PersonManager: React.FC = () => {
  const { admin } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form] = Form.useForm();

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/department`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setDepartments(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取部门失败');
    }
  };

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/person`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setPersons(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取被考核人失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchDepartments();
      fetchPersons();
    }
    // eslint-disable-next-line
  }, [admin]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (person: Person) => {
    setEditing(person);
    form.setFieldsValue(person);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/person/${id}`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      message.success('已删除');
      fetchPersons();
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await axios.put(`${API_BASE}/api/admin/person/${editing.id}`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('修改成功');
      } else {
        await axios.post(`${API_BASE}/api/admin/person`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchPersons();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '部门',
      dataIndex: 'department_id',
      key: 'department_id',
      render: (id: number) => departments.find(d => d.id === id)?.name || id
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Person) => (
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
    <Card title="被考核人管理" extra={<Button type="primary" onClick={handleAdd}>添加被考核人</Button>}>
      <Table rowKey="id" columns={columns} dataSource={persons} loading={loading} pagination={{ pageSize: 50 }} />
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleOk} title={editing ? '编辑被考核人' : '添加被考核人'}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="department_id" label="部门" rules={[{ required: true, message: '请选择部门' }]}> 
            <Select>
              {departments.map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PersonManager; 