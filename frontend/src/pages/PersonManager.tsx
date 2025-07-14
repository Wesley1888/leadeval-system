import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  Select,
  message,
  DatePicker,
  Row,
  Col,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

interface Person {
  id: number;
  name: string;
  gender: string;
  birth_date?: string;
  education?: string;
  title?: string;
  political_status?: string;
  current_position: string;
  appointment_date?: string;
  division_of_labor?: string;
  department_id: number;
  department_name?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
  code?: string;
  type: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const PersonManager: React.FC = () => {
  const { admin } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
  });
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    department_id: undefined as number | undefined,
    status: undefined as number | undefined
  });

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

  const fetchPersons = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...searchParams
      };

      const res = await axios.get(`${API_BASE}/api/admin/person`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params
      });

      const response: PaginatedResponse<Person> = res.data;
      setPersons(response.data);
      setPagination(prev => ({
        ...prev,
        current: response.page,
        pageSize: response.limit,
        total: response.total
      }));
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取人员失败');
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
    form.setFieldsValue({
      ...person,
      birth_date: person.birth_date ? dayjs(person.birth_date) : undefined,
      appointment_date: person.appointment_date ? dayjs(person.appointment_date) : undefined
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/person/${id}`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      message.success('删除成功');
      fetchPersons(pagination.current, pagination.pageSize);
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      const submitData = {
        ...values,
        birth_date: values.birth_date?.format('YYYY-MM-DD'),
        appointment_date: values.appointment_date?.format('YYYY-MM-DD')
      };

      if (editing) {
        await axios.put(`${API_BASE}/api/admin/person/${editing.id}`, submitData, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('修改成功');
      } else {
        await axios.post(`${API_BASE}/api/admin/person`, submitData, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
        message.success('添加成功');
      }
      setModalOpen(false);
      fetchPersons(pagination.current, pagination.pageSize);
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleSearch = () => {
    fetchPersons(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSearchParams({
      keyword: '',
      department_id: undefined,
      status: undefined
    });
    fetchPersons(1, pagination.pageSize);
  };

  const handleTableChange = (pagination: any) => {
    fetchPersons(pagination.current, pagination.pageSize);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => (
        <Tag color={gender === '男' ? 'blue' : 'pink'}>{gender}</Tag>
      )
    },
    {
      title: '现任职务',
      dataIndex: 'current_position',
      key: 'current_position',
      width: 150,
      ellipsis: true
    },
    {
      title: '所属部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 100
    },
    {
      title: '政治面貌',
      dataIndex: 'political_status',
      key: 'political_status',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '在职' : '离职'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Person) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="人员管理"
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchPersons(pagination.current, pagination.pageSize)}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加人员
          </Button>
        </Space>
      }
    >
      {/* 搜索区域 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="搜索姓名或职务"
              value={searchParams.keyword}
              onChange={(e) => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择部门"
              value={searchParams.department_id}
              onChange={(value) => setSearchParams(prev => ({ ...prev, department_id: value }))}
              allowClear
              style={{ width: '100%' }}
            >
              {departments.map(d => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              value={searchParams.status}
              onChange={(value) => setSearchParams(prev => ({ ...prev, status: value }))}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value={1}>在职</Select.Option>
              <Select.Option value={0}>离职</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 表格 */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={persons}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      {/* 添加/编辑模态框 */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        title={editing ? '编辑人员' : '添加人员'}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select>
                  <Select.Option value="男">男</Select.Option>
                  <Select.Option value="女">女</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="birth_date" label="出生年月">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="education" label="学历">
                <Select allowClear>
                  <Select.Option value="博士">博士</Select.Option>
                  <Select.Option value="硕士">硕士</Select.Option>
                  <Select.Option value="本科">本科</Select.Option>
                  <Select.Option value="专科">专科</Select.Option>
                  <Select.Option value="高中">高中</Select.Option>
                  <Select.Option value="初中">初中</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="职称">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="political_status" label="政治面貌">
                <Select allowClear>
                  <Select.Option value="中共党员">中共党员</Select.Option>
                  <Select.Option value="中共预备党员">中共预备党员</Select.Option>
                  <Select.Option value="共青团员">共青团员</Select.Option>
                  <Select.Option value="群众">群众</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="current_position"
                label="现任职务"
                rules={[{ required: true, message: '请输入现任职务' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="appointment_date" label="任职时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="division_of_labor" label="分管工作">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department_id"
                label="所属部门"
                rules={[{ required: true, message: '请选择部门' }]}
              >
                <Select>
                  {departments.map(d => (
                    <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                initialValue={1}
              >
                <Select>
                  <Select.Option value={1}>在职</Select.Option>
                  <Select.Option value={0}>离职</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default PersonManager; 