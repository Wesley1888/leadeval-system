import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, InputNumber, Select, Modal, Form, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: number;
  name: string;
}

interface Weight {
  id: number;
  department_id: number;
  department_name: string;
  role: string;
  weight: number;
  year: number;
}

const WeightManager: React.FC = () => {
  const { admin } = useAuth();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWeight, setEditingWeight] = useState<Weight | null>(null);
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

  const fetchWeights = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/weight`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setWeights(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取权重失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchDepartments();
      fetchWeights();
    }
    // eslint-disable-next-line
  }, [admin]);

  const handleAdd = () => {
    setEditingWeight(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Weight) => {
    setEditingWeight(record);
    form.setFieldsValue({
      department_id: record.department_id,
      role: record.role,
      weight: record.weight,
      year: record.year
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/weight/${id}`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      message.success('权重删除成功');
      fetchWeights();
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingWeight) {
        // 更新权重
        await axios.put(`${API_BASE}/api/admin/weight/${editingWeight.id}`, {
          weight: values.weight
        }, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('权重更新成功');
      } else {
        // 添加权重
        await axios.post(`${API_BASE}/api/admin/weight`, values, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('权重添加成功');
      }
      setModalVisible(false);
      fetchWeights();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (name: string, record: Weight) => (
        <span>{name || `部门ID: ${record.department_id}`}</span>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: any) => {
        const weightNum = Number(weight);
        return (
          <Tag color={weightNum > 1 ? 'green' : weightNum < 1 ? 'orange' : 'default'}>
            {weightNum.toFixed(2)}
          </Tag>
        );
      }
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Weight) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="权重管理" 
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加权重
        </Button>
      }
    >
      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={weights} 
        loading={loading} 
        pagination={{ pageSize: 50 }}
      />

      <Modal
        title={editingWeight ? '编辑权重' : '添加权重'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ year: 2025, weight: 1.0 }}
        >
          <Form.Item
            name="department_id"
            label="部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select placeholder="请选择部门" disabled={!!editingWeight}>
              {departments.map(d => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" disabled={!!editingWeight}>
              <Select.Option value="总经理">总经理</Select.Option>
              <Select.Option value="党委书记">党委书记</Select.Option>
              <Select.Option value="正科">正科</Select.Option>
              <Select.Option value="一般员工">一般员工</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="weight"
            label="权重"
            rules={[
              { required: true, message: '请输入权重' },
              { type: 'number', min: 0, max: 10, message: '权重必须在0-10之间' }
            ]}
          >
            <InputNumber
              placeholder="请输入权重"
              min={0}
              max={10}
              step={0.1}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="year"
            label="年份"
            rules={[{ required: true, message: '请输入年份' }]}
          >
            <InputNumber
              placeholder="请输入年份"
              min={2020}
              max={2030}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingWeight ? '更新' : '添加'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default WeightManager; 