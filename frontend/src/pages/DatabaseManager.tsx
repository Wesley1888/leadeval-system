import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message, Table, Space, Modal, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { DashboardOutlined, LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import mermaid from 'mermaid';

const { TextArea } = Input;

interface QueryResult {
  columns: string[];
  data: any[];
  affectedRows?: number;
  message?: string;
}

const ER_CACHE_KEY = 'db_er_diagram_cache_v1';

const DatabaseManager: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sql, setSql] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [tableStructure, setTableStructure] = useState<QueryResult | null>(null);
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // 新增：多条SQL结果状态
  const [multiResults, setMultiResults] = useState<{ sql: string, result: QueryResult }[]>([]);
  const [erDiagram, setErDiagram] = useState<string>(() => {
    // 初始值优先从localStorage读取
    return localStorage.getItem(ER_CACHE_KEY) || '';
  });
  const [erLoading, setErLoading] = useState(false);

  useEffect(() => {
    if (!admin) return;
    // 获取所有表名
    const fetchTables = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
        const response = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
          sql: 'SHOW TABLES'
        }, {
          headers: {
            'Authorization': `Bearer ${admin.token}`
          }
        });
        if (response.data && response.data.data) {
          // 兼容不同数据库返回格式
          const tableNames = response.data.data.map((row: any) => Object.values(row)[0]);
          setTables(tableNames);
        }
      } catch (e) {
        setTables([]);
      }
    };
    fetchTables();
  }, [admin]);

  // 获取所有表结构并生成ER图
  const generateERDiagram = async () => {
    if (!admin) return;
    setErLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      // 获取所有表名
      const tablesRes = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
        sql: 'SHOW TABLES'
      }, {
        headers: { 'Authorization': `Bearer ${admin.token}` }
      });
      const tableNames = tablesRes.data.data.map((row: any) => Object.values(row)[0]);
      // 获取每个表的字段
      const tableFields: Record<string, any[]> = {};
      for (const table of tableNames) {
        const descRes = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
          sql: `DESCRIBE \`${table}\``
        }, {
          headers: { 'Authorization': `Bearer ${admin.token}` }
        });
        tableFields[table] = descRes.data.data;
      }
      // 生成mermaid ER图代码
      let er = 'erDiagram\n';
      for (const table of tableNames) {
        er += `  ${table} {\n`;
        for (const col of tableFields[table]) {
          er += `    ${col.Type} ${col.Field}\n`;
        }
        er += '  }\n';
      }
      // 简单外键推断（如字段名为 xxx_id 且指向其他表主键）
      for (const table of tableNames) {
        for (const col of tableFields[table]) {
          if (col.Field.endsWith('_id')) {
            const refTable = tableNames.find((t: string) => t !== table && col.Field.startsWith(t.slice(0, -1))); // 粗略推断
            if (refTable) {
              er += `  ${table} }o--|| ${refTable} : 关联\n`;
            }
          }
        }
      }
      setErDiagram(er);
      localStorage.setItem(ER_CACHE_KEY, er); // 缓存到localStorage
    } finally {
      setErLoading(false);
    }
  };

  // 页面挂载时只渲染缓存，不自动请求数据库
  useEffect(() => {
    if (erDiagram) {
      setTimeout(() => { mermaid.init(undefined, '.mermaid'); }, 0);
    }
  }, [erDiagram]);

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
    if (!admin) return;
    if (!sql.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }

    // 分割多条SQL，去除空白
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
          allResults.push({ sql: singleSql, result: {
            columns: [],
            data: [],
            message: error.response?.data?.message || '执行失败'
          }});
        }
      }
      setResult(null); // 清空旧结果
      setMultiResults(allResults); // 新增：存储多条结果
      // 添加到历史记录
      if (!history.includes(sql.trim())) {
        setHistory(prev => [sql.trim(), ...prev.slice(0, 9)]); // 保留最近10条
      }
      message.success('SQL 执行完成');
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

  const handleTableClick = async (table: string) => {
    if (!admin) return;
    setSelectedTable(table);
    setTableStructure(null);
    setTableData(null);
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      // 查询表结构
      const structureRes = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
        sql: `DESCRIBE \`${table}\``
      }, {
        headers: { 'Authorization': `Bearer ${admin.token}` }
      });
      setTableStructure(structureRes.data);
      // 查询表数据
      const dataRes = await axios.post(`${API_BASE}/api/admin/execute-sql`, {
        sql: `SELECT * FROM \`${table}\` LIMIT 100`
      }, {
        headers: { 'Authorization': `Bearer ${admin.token}` }
      });
      setTableData(dataRes.data);
    } catch (e) {
      setTableStructure(null);
      setTableData(null);
    } finally {
      setLoading(false);
    }
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
          
          {/* 新增：数据库ER结构图 */}
          <Card 
            title="数据库ER结构图" 
            style={{ marginBottom: 24 }} 
            loading={erLoading}
            extra={
              <Button icon={<ReloadOutlined />} onClick={generateERDiagram} loading={erLoading}>
                刷新ER结构图
              </Button>
            }
          >
            <div className="mermaid">{erDiagram}</div>
          </Card>
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
              placeholder="请输入 SQL 语句，例如：SELECT * FROM user LIMIT 10; INSERT INTO user (name, age) VALUES ('Alice', 25);"
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

          {/* 新增：表名列表 */}
          {tables.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <b>所有表：</b>
              <Space wrap>
                {tables.map(table => (
                  <Button
                    key={table}
                    size="small"
                    type={selectedTable === table ? 'primary' : 'default'}
                    onClick={() => handleTableClick(table)}
                  >
                    {table}
                  </Button>
                ))}
              </Space>
            </div>
          )}
        </Card>

        {/* 结果显示 */}
        {multiResults.length > 0 && multiResults.map((item, idx) => (
          <Card key={idx} title={`SQL ${idx + 1}: ${item.sql}`}>
            {item.result.message && (
              <Alert
                message={item.result.message}
                type={item.result.message.includes('失败') ? 'error' : 'success'}
                style={{ marginBottom: 16 }}
              />
            )}
            
            {item.result.affectedRows !== undefined && (
              <Alert
                message={`影响行数：${item.result.affectedRows}`}
                type="info"
                style={{ marginBottom: 16 }}
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
                dataSource={item.result.data.map((row, index) => ({
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
        ))}

        {/* 新增：表结构和数据展示 */}
        {selectedTable && (
          <div style={{ marginBottom: 24 }}>
            <h4>表结构（{selectedTable}）：</h4>
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
                style={{ marginBottom: 16 }}
              />
            ) : <span style={{ color: '#999' }}>无结构信息</span>}
            <h4>表数据（前100行）：</h4>
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
                pagination={{ pageSize: 20 }}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            ) : <span style={{ color: '#999' }}>无数据</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManager; 