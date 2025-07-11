import React, { useState, useEffect } from 'react';
import { Card, Table, Button, InputNumber, Select, Tag, message } from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Department {
  id: number;
  name: string;
}
interface Code {
  id: string;
  department_id: number;
  role: string;
  used: boolean;
}

const CodeManager: React.FC = () => {
  const { admin } = useAuth();
  const [codes, setCodes] = useState<Code[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [genDept, setGenDept] = useState<number | undefined>(undefined);
  const [genRole, setGenRole] = useState<string>('一般员工');
  const [genCount, setGenCount] = useState<number>(1);
  const [filterDept, setFilterDept] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/department`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setDepartments(res.data.data || []);
      if (!genDept && res.data.data.length > 0) setGenDept(res.data.data[0].id);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取部门失败');
    }
  };

  const fetchCodes = async (departmentId?: number) => {
    setLoading(true);
    try {
      const url = departmentId ? `${API_BASE}/api/admin/code?department_id=${departmentId}` : `${API_BASE}/api/admin/code`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setCodes(res.data.data || []);
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
        role: genRole,
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
    { title: '考核码', dataIndex: 'id', key: 'id' },
    {
      title: '部门',
      dataIndex: 'department_id',
      key: 'department_id',
      render: (id: number) => departments.find(d => d.id === id)?.name || id
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>
    },
    {
      title: '使用状态',
      dataIndex: 'used',
      key: 'used',
      render: (used: boolean) => used ? <Tag color="red">已用</Tag> : <Tag color="green">未用</Tag>
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
      <Table rowKey="id" columns={columns} dataSource={codes} loading={loading} pagination={{ pageSize: 50 }} />
    </Card>
  );
};

export default CodeManager; 