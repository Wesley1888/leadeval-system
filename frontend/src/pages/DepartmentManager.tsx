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
  message,
  Select,
  Row,
  Col,
  Tag,
  Tooltip,
  Tree
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: number;
  name: string;
  code?: string;
  parent_id?: number;
  level: number;
  type: string;
  status: number;
  parent_name?: string;
  person_count?: number;
  created_at: string;
  updated_at: string;
}

interface DepartmentTree extends Department {
  children?: DepartmentTree[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const DepartmentManager: React.FC = () => {
  const { admin } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentTree, setDepartmentTree] = useState<DepartmentTree[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
  });
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    type: undefined as string | undefined,
    status: undefined as number | undefined
  });
  // 新增：根据层级动态过滤上级部门可选项
  const [parentOptions, setParentOptions] = useState<Department[]>([]);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchDepartments = async (page = 1, pageSize = 50) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...searchParams,
        sort_by: 'code',
        order: 'asc',
      };

      const res = await axios.get(`${API_BASE}/api/admin/department`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params
      });

      const response: PaginatedResponse<Department> = res.data;
      setDepartments(response.data);
      setPagination(prev => ({
        ...prev,
        current: response.page,
        pageSize: response.limit,
        total: response.total
      }));
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取部门失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentTree = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/department/tree`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setDepartmentTree(res.data);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取部门树失败');
    }
  };

  useEffect(() => {
    if (admin) {
      if (viewMode === 'list') {
        fetchDepartments();
      } else {
        fetchDepartmentTree();
      }
    }
    // eslint-disable-next-line
  }, [admin, viewMode]);

  const handleAdd = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/department/max-code`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      const maxCode = parseInt(res.data.maxCode || '0', 10);
      const nextCode = String(maxCode + 100).padStart(5, '0');
    setEditing(null);
      form.setFieldsValue({ code: nextCode });
      form.resetFields(['name', 'parent_id', 'level', 'type', 'status']);
    setModalOpen(true);
    } catch {
      message.error('获取最大部门编码失败');
    }
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
      message.success('删除成功');
      if (viewMode === 'list') {
        fetchDepartments(pagination.current, pagination.pageSize);
      } else {
        fetchDepartmentTree();
      }
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
      if (viewMode === 'list') {
        fetchDepartments(pagination.current, pagination.pageSize);
      } else {
        fetchDepartmentTree();
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleSearch = () => {
    fetchDepartments(1, pagination.pageSize);
  };

  const handleReset = () => {
    setSearchParams({
      keyword: '',
      type: undefined,
      status: undefined
    });
    fetchDepartments(1, pagination.pageSize);
  };

  const handleTableChange = (pagination: any) => {
    fetchDepartments(pagination.current, pagination.pageSize);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => {
        if (level === 1) return '一级部门';
        if (level === 2) return '二级部门';
        if (level === 3) return '三级部门';
        return level;
      }
    },
    {
      title: '部门类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => (
        <Tag color={
          type === '职能管理部门' ? 'blue' :
          type === '二级单位' ? 'green' :
          type === '独资公司' ? 'orange' :
          type === '参控股公司' ? 'purple' : 'default'
        }>
          {type}
        </Tag>
      )
    },
    {
      title: '人员数量',
      dataIndex: 'person_count',
      key: 'person_count',
      width: 100,
      render: (count: number) => count || 0
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Department) => (
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

  const renderTreeData = (data: DepartmentTree[]): any[] => {
    return data.map(item => ({
      key: item.id,
      title: (
        <Space>
          <span>{item.name}</span>
          <Tag color={item.status === 1 ? 'green' : 'red'}>
            {item.status === 1 ? '启用' : '禁用'}
          </Tag>
          {item.person_count && (
            <Tag color="blue">{item.person_count}人</Tag>
          )}
        </Space>
      ),
      children: item.children ? renderTreeData(item.children) : undefined
    }));
  };

  // 监听层级变化，动态设置上级部门可选项
  const handleLevelChange = (level: number) => {
    if (level === 1) {
      setParentOptions([]);
      form.setFieldsValue({ parent_id: undefined });
    } else if (level === 2) {
      setParentOptions(departments.filter(dep => dep.level === 1));
      form.setFieldsValue({ parent_id: undefined });
    } else if (level === 3) {
      setParentOptions(departments.filter(dep => dep.level === 2));
      form.setFieldsValue({ parent_id: undefined });
    } else {
      setParentOptions([]);
      form.setFieldsValue({ parent_id: undefined });
    }
  };

  // 初始化编辑时的上级部门选项
  useEffect(() => {
    if (modalOpen) {
      const level = form.getFieldValue('level');
      handleLevelChange(level);
    }
    // eslint-disable-next-line
  }, [modalOpen]);

  // 计算所有一级部门id用于树形视图默认展开（受控模式）
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  useEffect(() => {
    if (viewMode === 'tree' && departmentTree.length > 0) {
      const keys = departmentTree.filter(dep => dep.level === 1).map(dep => dep.id);
      setExpandedKeys(keys);
    }
  }, [departmentTree, viewMode]);

  return (
    <Card
      title="部门管理"
      extra={
        <Space>
          <Button.Group>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<ApartmentOutlined />}
              onClick={() => setViewMode('list')}
            >
              列表视图
            </Button>
            <Button
              type={viewMode === 'tree' ? 'primary' : 'default'}
              icon={<TeamOutlined />}
              onClick={() => setViewMode('tree')}
            >
              树形视图
            </Button>
          </Button.Group>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => viewMode === 'list' ? fetchDepartments(pagination.current, pagination.pageSize) : fetchDepartmentTree()}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加部门
          </Button>
        </Space>
      }
    >
      {viewMode === 'list' && (
        <>
          {/* 搜索区域 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Input
                  placeholder="搜索部门名称或编码"
                  value={searchParams.keyword}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
                  onPressEnter={handleSearch}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="选择部门类型"
                  value={searchParams.type}
                  onChange={(value) => setSearchParams(prev => ({ ...prev, type: value }))}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Select.Option value="职能管理部门">职能管理部门</Select.Option>
                  <Select.Option value="二级单位">二级单位</Select.Option>
                  <Select.Option value="独资公司">独资公司</Select.Option>
                  <Select.Option value="参控股公司">参控股公司</Select.Option>
                  <Select.Option value="托管单位">托管单位</Select.Option>
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
                  <Select.Option value={1}>启用</Select.Option>
                  <Select.Option value={0}>禁用</Select.Option>
                </Select>
              </Col>
              <Col span={4}>
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
            dataSource={departments}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            // 默认按code排序
            // sorted by columns sorter
          />
        </>
      )}

      {viewMode === 'tree' && (
        <Tree
          showLine
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          treeData={renderTreeData(departmentTree)}
        />
      )}

      {/* 添加/编辑模态框 */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        title={editing ? '编辑部门' : '添加部门'}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="部门名称"
                rules={[{ required: true, message: '请输入部门名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="部门编码">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parent_id" label="上级部门">
                <Select allowClear placeholder="请选择上级部门" disabled={parentOptions.length === 0}>
                  {parentOptions.map(d => (
                    <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="level"
                label="部门层级"
                initialValue={1}
              >
                <Select onChange={handleLevelChange}>
                  <Select.Option value={1}>一级部门</Select.Option>
                  <Select.Option value={2}>二级部门</Select.Option>
                  <Select.Option value={3}>三级部门</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="部门类型"
                rules={[{ required: true, message: '请选择部门类型' }]}
              >
                <Select>
                  <Select.Option value="职能管理部门">职能管理部门</Select.Option>
                  <Select.Option value="二级单位">二级单位</Select.Option>
                  <Select.Option value="独资公司">独资公司</Select.Option>
                  <Select.Option value="参控股公司">参控股公司</Select.Option>
                  <Select.Option value="托管单位">托管单位</Select.Option>
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
                  <Select.Option value={1}>启用</Select.Option>
                  <Select.Option value={0}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentManager; 