import React, { useEffect, useState } from 'react';
import { Card, Table, Select, Button, message, Tag } from 'antd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface StatRow {
  person_id: number;
  person_name: string;
  department_id: number;
  department_name: string;
  scores: Record<string, number>;
  total: number;
  average: string;
}

interface Department {
  id: number;
  name: string;
}

const StatResult: React.FC = () => {
  const { admin } = useAuth();
  const [stat, setStat] = useState<StatRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filterDept, setFilterDept] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  // 获取部门列表
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

  // 获取统计数据
  const fetchStat = async (departmentId?: number) => {
    setLoading(true);
    try {
      const params: any = {};
      if (departmentId) params.department_id = departmentId;
      const res = await axios.get(`${API_BASE}/api/score/stat`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params
      });
      setStat(res.data);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchDepartments();
      fetchStat();
    }
    // eslint-disable-next-line
  }, [admin]);

  useEffect(() => {
    if (admin) fetchStat(filterDept);
    // eslint-disable-next-line
  }, [filterDept]);

  // 动态生成统计表头
  const indicatorIds = stat.length ? Object.keys(stat[0].scores) : [];
  const statColumns = [
    { title: '被考核人ID', dataIndex: 'person_id', key: 'person_id' },
    { title: '姓名', dataIndex: 'person_name', key: 'person_name' },
    { title: '部门', dataIndex: 'department_name', key: 'department_name' },
    ...indicatorIds.map(id => ({ title: `指标${id}`, dataIndex: ['scores', id], key: id })),
    { title: '总分', dataIndex: 'total', key: 'total', render: (v: number) => <Tag color="blue">{v}</Tag> },
    { title: '平均分', dataIndex: 'average', key: 'average', render: (v: string) => <Tag>{v}</Tag> }
  ];

  // 导出Excel
  const handleExport = async () => {
    try {
      const params: any = {};
      if (filterDept) params.department_id = filterDept;
      const res = await axios.get(`${API_BASE}/api/score/export`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'scores.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('导出失败');
    }
  };

  return (
    <Card title="统计结果" extra={<Button onClick={handleExport}>导出Excel</Button>}>
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
        rowKey="person_id"
        columns={statColumns}
        dataSource={stat}
        loading={loading}
        pagination={{ pageSize: 50 }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default StatResult; 