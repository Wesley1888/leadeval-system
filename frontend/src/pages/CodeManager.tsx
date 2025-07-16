import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  InputNumber,
  Select,
  Tag,
  message
} from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: number;
  name: string;
  code?: string;
  type: string;
}

interface EvaluationCode {
  id: number;
  code: string;
  department_id: number;
  department_name?: string;
  evaluator_type: string;
  weight: number;
  status: number; // 1=未用, 2=已用, 0=禁用
  used_at?: string;
  created_at: string;
  updated_at: string;
}

const CodeManager: React.FC = () => {
  const { admin } = useAuth();
  const [codes, setCodes] = useState<EvaluationCode[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // 添加缺失的状态变量
  const [filterDept, setFilterDept] = useState<number | undefined>(undefined);
  const [genDept, setGenDept] = useState<number | undefined>(undefined);
  const [genRole, setGenRole] = useState<string>('总经理');
  const [genCount, setGenCount] = useState<number>(1);
  const [genWeight, setGenWeight] = useState<number>(1);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });

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

  const fetchCodes = async (page = 1, pageSize = 50) => {
    setLoading(true);
    try {
      const url = filterDept ? `${API_BASE}/api/admin/code?department_id=${filterDept}&page=${page}&limit=${pageSize}` : `${API_BASE}/api/admin/code?page=${page}&limit=${pageSize}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setCodes(res.data.data || []);
      setPagination({
        current: page,
        pageSize,
        total: res.data.total || 0
      });
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取考核码失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchDepartments();
      fetchCodes();
    }
    // eslint-disable-next-line
  }, [admin]);

  // 筛选部门时刷新表格
  useEffect(() => {
    if (admin) fetchCodes(filterDept);
    // eslint-disable-next-line
  }, [filterDept]);

  const handleGenerate = async () => {
    if (!genDept) return;
    try {
      await axios.post(`${API_BASE}/api/admin/code/generate`, {
        department_id: genDept,
        evaluator_type: genRole, // 参数名与后端一致
        weight: genWeight,
        count: genCount
      }, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      message.success(`已为${departments.find(d => d.id === genDept)?.name}生成${genCount}个${genRole}考核码`);
      fetchCodes(filterDept);
    } catch (err: any) {
      message.error(err.response?.data?.message || '生成失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '考核码', dataIndex: 'code', key: 'code' },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (name: string, record: EvaluationCode) => name || `部门ID: ${record.department_id}`
    },
    {
      title: '角色',
      dataIndex: 'evaluator_type',
      key: 'evaluator_type',
      render: (role: string) => <Tag color="blue">{role}</Tag>
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      render: (w: number) => w
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        if (status === 2) return <Tag color="red">已用</Tag>;
        if (status === 1) return <Tag color="green">未用</Tag>;
        if (status === 0) return <Tag color="gray">禁用</Tag>;
        return status;
      }
    },
    {
      title: '使用时间',
      dataIndex: 'used_at',
      key: 'used_at',
      render: (t?: string) => t ? t.replace('T', ' ').slice(0, 19) : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t: string) => t.replace('T', ' ').slice(0, 19)
    }
  ];

  return (
    <Card title="考核码管理">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span>选择部门：</span>
        <Select value={genDept} onChange={setGenDept} style={{ width: 200 }}>
          {departments.map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
        </Select>
        <span>角色：</span>
        <Select value={genRole} onChange={setGenRole} style={{ width: 150 }}>
          <Select.Option value="总经理">总经理</Select.Option>
          <Select.Option value="党委书记">党委书记</Select.Option>
          <Select.Option value="正科">正科</Select.Option>
          <Select.Option value="一般员工">一般员工</Select.Option>
        </Select>
        <span>生成数量：</span>
        <InputNumber min={1} max={100} value={genCount} onChange={v => setGenCount(v || 1)} />
        <span>权重：</span>
        <InputNumber min={0} max={10} value={genWeight} onChange={v => setGenWeight(v || 0)} />
        <Button type="primary" onClick={handleGenerate}>生成考核码</Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <span>筛选部门：</span>
        <Select
          allowClear
          placeholder="全部"
          value={filterDept}
          onChange={setFilterDept}
          style={{ width: 200 }}
        >
          {departments.map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
        </Select>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={codes}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => fetchCodes(page, pageSize)
        }}
      />
    </Card>
  );
};

export default CodeManager; 