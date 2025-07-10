import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tabs, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { LogoutOutlined } from '@ant-design/icons';

interface ScoreDetail {
  scorer_code: string;
  target_id: number;
  indicator_id: number;
  score: number;
  year: number;
}

interface StatRow {
  target_id: number;
  target_name: string;
  department: number;
  department_name: string;
  scores: Record<string, number>;
  total: number;
  average: string;
}

const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ScoreDetail[]>([]);
  const [stat, setStat] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'stat'>('detail');

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<ScoreDetail[]>(`${API_BASE}/api/score/all`, {
        headers: { Authorization: `Bearer ${admin!.token}` },
        params: { year: new Date().getFullYear() + 1 }
      });
      setData(res.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStat = async () => {
    setLoading(true);
    try {
      const res = await axios.get<StatRow[]>(`${API_BASE}/api/score/stat`, {
        headers: { Authorization: `Bearer ${admin!.token}` },
        params: { year: new Date().getFullYear() + 1 }
      });
      setStat(res.data);
    } catch (error) {
      message.error('获取统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'detail') {
      fetchData();
    }
    if (activeTab === 'stat') {
      fetchStat();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const handleExport = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/score/export?year=${new Date().getFullYear() + 1}`,
        {
          headers: { Authorization: `Bearer ${admin!.token}` },
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
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleNavigateToProjectTasks = () => {
    navigate('/admin/project-tasks');
  };

  const handleNavigateToDatabase = () => {
    navigate('/admin/database');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const detailColumns = [
    { title: '打分人考核码', dataIndex: 'scorer_code', key: 'scorer_code' },
    { title: '被考核人ID', dataIndex: 'target_id', key: 'target_id' },
    { title: '指标ID', dataIndex: 'indicator_id', key: 'indicator_id' },
    { title: '分数', dataIndex: 'score', key: 'score' },
    { title: '年份', dataIndex: 'year', key: 'year' }
  ];

  // 动态生成统计表头
  const indicatorIds = stat.length ? Object.keys(stat[0].scores) : [];
  const statColumns = [
    { title: '被考核人ID', dataIndex: 'target_id', key: 'target_id' },
    { title: '姓名', dataIndex: 'target_name', key: 'target_name' },
    { title: '部门', dataIndex: 'department_name', key: 'department_name' },
    ...indicatorIds.map(id => ({ title: `指标${id}`, dataIndex: ['scores', id], key: id })),
    { title: '总分', dataIndex: 'total', key: 'total' },
    { title: '平均分', dataIndex: 'average', key: 'average' }
  ];

  return (
    <div style={{
      maxWidth: 1200,
      minHeight: '100vh',
      margin: '0 auto',
      padding: 0,
      background: '#f5f7fa',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 0, width: '100%', maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottom: '1px solid #f0f0f0', borderRadius: '12px 12px 0 0', background: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#1976a1', marginRight: 16 }}>管理员：<span style={{ marginLeft: 8 }}>{admin!.name}</span></div>
          <div>
            <Button 
              type="primary" 
              onClick={handleNavigateToProjectTasks} 
              style={{ marginRight: 8, borderRadius: 8 }}
            >
              项目任务管理
            </Button>
            <Button 
              type="primary" 
              onClick={handleNavigateToDatabase} 
              style={{ marginRight: 8, borderRadius: 8 }}
            >
              数据库管理
            </Button>
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout} 
              style={{ borderRadius: 8 }}
            >
              退出登录
            </Button>
          </div>
        </div>
        <div style={{ padding: 24, overflowX: 'auto' }}>
          <Tabs
            activeKey={activeTab}
            onChange={key => setActiveTab(key as 'detail' | 'stat')}
            items={[
              {
                key: 'detail',
                label: '打分明细',
                children: <>
                  <Button type="primary" onClick={handleExport} style={{ marginBottom: 16, borderRadius: 8 }}>导出Excel</Button>
                  <Table columns={detailColumns} dataSource={data} rowKey={(_, i) => i ?? 0} loading={loading} bordered scroll={{ x: '100%' }} size="middle" style={{ minWidth: 600 }} />
                </>
              },
              {
                key: 'stat',
                label: '打分统计',
                children: <Table columns={statColumns} dataSource={stat} rowKey={r => r.target_id} loading={loading} bordered scroll={{ x: '100%' }} size="middle" style={{ minWidth: 600 }} />
              }
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard; 