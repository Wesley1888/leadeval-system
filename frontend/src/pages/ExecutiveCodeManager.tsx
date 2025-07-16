import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  message,
  Space,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  Tag
} from 'antd';
import { CrownOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ExecutiveCode {
  id: number;
  code: string;
  department_id: number;
  department_name?: string;
  evaluator_type: string;
  weight: number;
  status: number;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyLeader {
  id: number;
  name: string;
  title: string;
}

const ExecutiveCodeManager: React.FC = () => {
  const { admin } = useAuth();
  const [codes, setCodes] = useState<ExecutiveCode[]>([]);
  const [leaders, setLeaders] = useState<CompanyLeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unused: 0,
    used: 0,
    disabled: 0
  });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchExecutiveCodes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/code?department_id=1&limit=1000`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setCodes(res.data.data || []);
      
      // 计算统计信息
      const total = res.data.data?.length || 0;
      const unused = res.data.data?.filter((c: ExecutiveCode) => c.status === 1).length || 0;
      const used = res.data.data?.filter((c: ExecutiveCode) => c.status === 2).length || 0;
      const disabled = res.data.data?.filter((c: ExecutiveCode) => c.status === 0).length || 0;
      
      setStats({ total, unused, used, disabled });
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取高层考核码失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyLeaders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/person?title=公司领导&limit=1000`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      setLeaders(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取公司领导失败');
    }
  };

  const handleGenerateExecutiveCodes = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/code/generate-executive`, {}, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      
      message.success(`${res.data.message} - 预期生成${leaders.length}个，实际生成${res.data.generated_count}个`);
      
      // 添加延迟确保数据库操作完成
      setTimeout(() => {
        fetchExecutiveCodes();
        fetchCompanyLeaders();
      }, 500);
    } catch (err: any) {
      message.error(err.response?.data?.message || '生成高层考核码失败');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchExecutiveCodes();
      fetchCompanyLeaders();
    }
  }, [admin]);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '考核码', dataIndex: 'code', key: 'code', width: 120 },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (name: string, record: ExecutiveCode) => name || `部门ID: ${record.department_id}`
    },
    {
      title: '考核人',
      dataIndex: 'evaluator_type',
      key: 'evaluator_type',
      render: (name: string) => <span style={{ fontWeight: 'bold', color: '#1677ff' }}>{name}</span>
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (w: number) => `${w}%`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 150,
      render: (t?: string) => t ? t.replace('T', ' ').slice(0, 19) : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (t: string) => t.replace('T', ' ').slice(0, 19)
    }
  ];

  return (
    <div>
      <Card 
        title={
          <Space>
            <CrownOutlined style={{ color: '#faad14' }} />
            <span>高层考核码管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              loading={generating}
              disabled={leaders.length === 0}
              onClick={handleGenerateExecutiveCodes}
            >
              生成高层考核码 {leaders.length > 0 && `(${leaders.length}人)`}
            </Button>
            <Button onClick={fetchExecutiveCodes} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <Alert
          message="高层考核码说明"
          description="系统将自动为所有title为'公司领导'的人员生成考核码。每次生成会删除当年部门ID为1的旧考核码，然后为每个公司领导生成新的考核码。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="总考核码数" value={stats.total} />
          </Col>
          <Col span={6}>
            <Statistic title="未使用" value={stats.unused} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={6}>
            <Statistic title="已使用" value={stats.used} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="已禁用" value={stats.disabled} valueStyle={{ color: '#999' }} />
          </Col>
        </Row>

        {leaders.length > 0 && (
          <Card size="small" title={`公司领导列表 (共${leaders.length}人)`} style={{ marginBottom: 16 }}>
            <Space wrap>
              {leaders.map(leader => (
                <span key={leader.id} style={{ 
                  padding: '4px 8px', 
                  background: '#f0f0f0', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {leader.name}
                </span>
              ))}
            </Space>
          </Card>
        )}

        {leaders.length === 0 && (
          <Alert
            message="未找到公司领导"
            description="当前没有title为'公司领导'的人员，请先在人员管理中设置相关人员。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={codes}
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default ExecutiveCodeManager; 