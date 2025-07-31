import React, { useState, useEffect, useMemo } from 'react';
import { Card, Input, Button, message, Table, Space, Alert, Divider, Row, Col, List } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface QueryResult {
  columns: string[];
  data: any[];
  affectedRows?: number;
  message?: string;
}

const DatabaseManager: React.FC = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [sql, setSql] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [tableStructure, setTableStructure] = useState<QueryResult | null>(null);
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [multiResults, setMultiResults] = useState<{ sql: string, result: QueryResult }[]>([]);
  const [tableSearch, setTableSearch] = useState('');

  // 获取所有表名
  useEffect(() => {
    if (!admin) return;
    const fetchTables = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
        const response = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
          sql: 'SHOW TABLES'
        }, {
          headers: { 'Authorization': `Bearer ${admin.token}` }
        });
        if (response.data && response.data.data) {
          const tableNames = response.data.data.map((row: any) => Object.values(row)[0]);
          setTables(tableNames);
        }
      } catch (e: any) {
        setTables([]);
        console.error(e);
        message.error(e?.response?.data?.message || e?.message || JSON.stringify(e));
      }
    };
    fetchTables();
  }, [admin]);

  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    return tables.filter(t => t.toLowerCase().includes(tableSearch.trim().toLowerCase()));
  }, [tables, tableSearch]);

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
    if (!admin) return;
    if (!sql.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }
    const sqlList = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    if (sqlList.length === 0) {
      message.warning('请输入有效的 SQL 语句');
      return;
    }
    setLoading(true);
    const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
    const allResults: { sql: string, result: QueryResult }[] = [];
    try {
      for (let singleSql of sqlList) {
        try {
          const response = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
            sql: singleSql
          }, {
            headers: {
              'Authorization': `Bearer ${admin.token}`
            }
          });
          allResults.push({ sql: singleSql, result: response.data });
        } catch (error: any) {
          console.error(error);
          allResults.push({ sql: singleSql, result: {
            columns: [],
            data: [],
            message: error?.response?.data?.message || error?.message || JSON.stringify(error)
          }});
        }
      }
      setMultiResults(allResults);
      if (!history.includes(sql.trim())) {
        setHistory(prev => [sql.trim(), ...prev.slice(0, 9)]);
      }
      message.success('SQL 执行完成');
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.message || e?.message || JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historySql: string) => {
    setSql(historySql);
  };

  const handleClear = () => {
    setSql('');
  };

  const handleTableClick = async (table: string) => {
    if (!admin) return;
    setSelectedTable(table);
    setTableStructure(null);
    setTableData(null);
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      const structureRes = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
        sql: `DESCRIBE \`${table}\``.replace(/\\`/g, '`')
      }, {
        headers: { 'Authorization': `Bearer ${admin.token}` }
      });
      setTableStructure(structureRes.data);
      const dataRes = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
        sql: `SELECT * FROM \`${table}\` LIMIT 100`.replace(/\\`/g, '`')
      }, {
        headers: { 'Authorization': `Bearer ${admin.token}` }
      });
      setTableData(dataRes.data);
    } catch (e: any) {
      setTableStructure(null);
      setTableData(null);
      console.error(e);
      message.error(e?.response?.data?.message || e?.message || JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={16}>
      {/* 左侧表列表 */}
      <Col span={5}>
        <Card
          title="所有表"
          bodyStyle={{ padding: 0 }}
          style={{ height: '100%', minHeight: 600 }}
          extra={
            <Input
              allowClear
              size="small"
              placeholder="搜索表"
              prefix={<SearchOutlined />}
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              style={{ width: 120 }}
            />
          }
        >
          <List
            size="small"
            bordered
            dataSource={filteredTables}
            style={{ maxHeight: 600, overflow: 'auto' }}
            renderItem={item => (
              <List.Item
                style={{ cursor: 'pointer', background: selectedTable === item ? '#e6f7ff' : undefined }}
                onClick={() => handleTableClick(item)}
              >
                {item}
              </List.Item>
            )}
          />
        </Card>
      </Col>
      {/* 右侧主内容区 */}
      <Col span={19}>
        <Alert
          message="⚠️ 安全提醒"
          description="此功能允许执行任意 SQL 语句，请谨慎操作。建议在执行前备份数据库。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        {selectedTable && (
          <Card title={`表结构：${selectedTable}`} style={{ marginBottom: 16 }}>
            {tableStructure && tableStructure.data && tableStructure.data.length > 0 ? (
              <Table
                columns={tableStructure.columns.map(col => ({
                  title: col,
                  dataIndex: col,
                  key: col
                }))}
                dataSource={tableStructure.data.map((row, idx) => ({ key: idx, ...row }))}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                style={{ marginBottom: 0 }}
              />
            ) : <span style={{ color: '#999' }}>无结构信息</span>}
          </Card>
        )}
        {selectedTable && (
          <Card title={`表数据：${selectedTable}（前100行）`} style={{ marginBottom: 16 }}>
            {tableData && tableData.data && tableData.data.length > 0 ? (
              <Table
                columns={tableData.columns.map(col => ({
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
                dataSource={tableData.data.map((row, idx) => ({ key: idx, ...row }))}
                pagination={{ 
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  size: 'small'
                }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            ) : <span style={{ color: '#999' }}>无数据</span>}
          </Card>
        )}
        <Card title="SQL操作" style={{ marginBottom: 16 }}>
          <TextArea
            rows={6}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="请输入 SQL 语句，例如：SELECT * FROM user LIMIT 10; INSERT INTO user (name, age) VALUES ('Alice', 25);"
            style={{ fontFamily: 'monospace', marginBottom: 16 }}
            onPressEnter={e => {
              if (e.ctrlKey || e.metaKey) handleExecute();
            }}
          />
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<PlayCircleOutlined />} type="primary" onClick={handleExecute} loading={loading}>
              执行 SQL
            </Button>
            <Button onClick={handleClear}>清空</Button>
          </Space>
          <Divider orientation="left" style={{ margin: '16px 0' }}>历史记录</Divider>
          {history.length > 0 && (
            <Space wrap style={{ marginBottom: 16 }}>
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
          )}
        </Card>
        <Card title="SQL执行结果">
          {multiResults.length > 0 ? multiResults.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 24 }}>
              <b>SQL {idx + 1}: {item.sql}</b>
              {item.result.message && (
                <Alert
                  message={item.result.message}
                  type={item.result.message.includes('失败') ? 'error' : 'success'}
                  style={{ margin: '8px 0' }}
                />
              )}
              {item.result.affectedRows !== undefined && (
                <Alert
                  message={`影响行数：${item.result.affectedRows}`}
                  type="info"
                  style={{ margin: '8px 0' }}
                />
              )}
              {item.result.data && item.result.data.length > 0 && (
                <Table
                  columns={item.result.columns.map(col => ({
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
                  dataSource={item.result.data.map((row, index) => ({ key: index, ...row }))}
                  pagination={{ 
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} 共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
          size: 'default'
        }}
                  scroll={{ x: 'max-content' }}
                  size="small"
                />
              )}
            </div>
          )) : <span style={{ color: '#999' }}>暂无结果</span>}
        </Card>
      </Col>
    </Row>
  );
};

export default DatabaseManager; 