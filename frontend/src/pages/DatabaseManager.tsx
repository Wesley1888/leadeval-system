import React, { useState } from 'react';
import { Card, Input, Button, message, Table, Space, Modal, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { DashboardOutlined, LogoutOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface QueryResult {
  columns: string[];
  data: any[];
  affectedRows?: number;
  message?: string;
}

const DatabaseManager: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sql, setSql] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // 检查是否为管理员
  if (!admin) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Alert
          message="访问被拒绝"
          description="只有管理员才能访问数据库管理功能"
          type="error"
          showIcon
        />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/admin/login')}>
          返回登录
        </Button>
      </div>
    );
  }

  const handleExecute = async () => {
    if (!sql.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      const response = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
        sql: sql.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${admin.token}`
        }
      });

      const data = response.data;
      setResult(data);
      
      // 添加到历史记录
      if (!history.includes(sql.trim())) {
        setHistory(prev => [sql.trim(), ...prev.slice(0, 9)]); // 保留最近10条
      }
      
      message.success('SQL 执行成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'SQL 执行失败');
      setResult({
        columns: [],
        data: [],
        message: error.response?.data?.message || '执行失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historySql: string) => {
    setSql(historySql);
  };

  const handleClear = () => {
    setSql('');
    setResult(null);
  };

  const handleNavigateToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', overflow: 'auto', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>数据库管理</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, color: '#666', marginRight: 16 }}>
                管理员：<span style={{ marginLeft: 8 }}>{admin.name}</span>
              </span>
              </div>
            </div>
          } 
          extra={
            <Space>
              <Button 
                icon={<DashboardOutlined />} 
                onClick={handleNavigateToDashboard}
                style={{ borderRadius: 8 }}
              >
                返回仪表盘
              </Button>
              <Button 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                style={{ borderRadius: 8 }}
              >
                退出登录
              </Button>
            </Space>
          } 
          style={{ marginBottom: 24 }}
        >
          <Alert
            message="⚠️ 安全提醒"
            description="此功能允许执行任意 SQL 语句，请谨慎操作。建议在执行前备份数据库。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <div style={{ marginBottom: 16 }}>
            <TextArea
              rows={6}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="请输入 SQL 语句，例如：SELECT * FROM user LIMIT 10;"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={handleExecute} loading={loading}>
              执行 SQL
            </Button>
            <Button onClick={handleClear}>清空</Button>
          </Space>

          {/* 历史记录 */}
          {history.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4>历史记录：</h4>
              <Space wrap>
                {history.map((sql, index) => (
                  <Button
                    key={index}
                    size="small"
                    onClick={() => handleHistoryClick(sql)}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  >
                    {sql.length > 30 ? sql.substring(0, 30) + '...' : sql}
                  </Button>
                ))}
              </Space>
            </div>
          )}
        </Card>

        {/* 结果显示 */}
        {result && (
          <Card title="执行结果">
            {result.message && (
              <Alert
                message={result.message}
                type={result.message.includes('失败') ? 'error' : 'success'}
                style={{ marginBottom: 16 }}
              />
            )}
            
            {result.affectedRows !== undefined && (
              <Alert
                message={`影响行数：${result.affectedRows}`}
                type="info"
                style={{ marginBottom: 16 }}
              />
            )}

            {result.data && result.data.length > 0 && (
              <Table
                columns={result.columns.map(col => ({
                  title: col,
                  dataIndex: col,
                  key: col,
                  render: (text: any) => {
                    if (text === null || text === undefined) {
                      return <span style={{ color: '#999' }}>NULL</span>;
                    }
                    if (typeof text === 'object') {
                      return JSON.stringify(text);
                    }
                    return String(text);
                  }
                }))}
                dataSource={result.data.map((row, index) => ({
                  key: index,
                  ...row
                }))}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default DatabaseManager; 