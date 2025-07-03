import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tabs } from 'antd';
import axios from 'axios';

const AdminDashboard = ({ admin, onLogout }) => {
  const [data, setData] = useState([]);
  const [stat, setStat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/score/all', {
        headers: { Authorization: `Bearer ${admin.token}` },
        params: { year: new Date().getFullYear() + 1 }
      });
      setData(res.data);
    } catch {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStat = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/score/stat', {
        headers: { Authorization: `Bearer ${admin.token}` },
        params: { year: new Date().getFullYear() + 1 }
      });
      setStat(res.data);
    } catch {
      message.error('获取统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'detail') fetchData();
    if (activeTab === 'stat') fetchStat();
    // eslint-disable-next-line
  }, [activeTab]);

  const handleExport = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3001/api/score/export?year=${new Date().getFullYear() + 1}`,
        {
          headers: { Authorization: `Bearer ${admin.token}` },
          responseType: 'blob'
        }
      );
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'scores.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      message.error('导出失败');
    }
  };

  const detailColumns = [
    { title: '打分人考核码', dataIndex: 'scorer_code', key: 'scorer_code' },
    { title: '被考核码', dataIndex: 'target_code', key: 'target_code' },
    { title: '指标ID', dataIndex: 'indicator_id', key: 'indicator_id' },
    { title: '分数', dataIndex: 'score', key: 'score' },
    { title: '年份', dataIndex: 'year', key: 'year' }
  ];

  // 动态生成统计表头
  const indicatorIds = stat.length ? Object.keys(stat[0].scores) : [];
  const statColumns = [
    { title: '被考核码', dataIndex: 'target_code', key: 'target_code' },
    { title: '姓名', dataIndex: 'target_name', key: 'target_name' },
    { title: '部门', dataIndex: 'department_name', key: 'department_name' },
    ...indicatorIds.map(id => ({ title: `指标${id}`, dataIndex: ['scores', id], key: id })),
    { title: '总分', dataIndex: 'total', key: 'total' },
    { title: '平均分', dataIndex: 'average', key: 'average' }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>管理员：{admin.name}（{admin.code}）</div>
        <Button onClick={onLogout}>退出登录</Button>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'detail',
          label: '打分明细',
          children: <>
            <Button type="primary" onClick={handleExport} style={{ marginBottom: 16 }}>导出Excel</Button>
            <Table columns={detailColumns} dataSource={data} rowKey={(_, i) => i} loading={loading} bordered />
          </>
        },
        {
          key: 'stat',
          label: '打分统计',
          children: <Table columns={statColumns} dataSource={stat} rowKey={r => r.target_code} loading={loading} bordered />
        }
      ]} />
    </div>
  );
};

export default AdminDashboard; 