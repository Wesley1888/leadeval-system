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

interface Task {
  id: number;
  name: string;
  status: string;
}

const CodeManager: React.FC = () => {
  const { admin } = useAuth();
  const [codes, setCodes] = useState<EvaluationCode[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // 添加缺失的状态变量
  const [filterDept, setFilterDept] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });

  // 新增：一键生成考核码相关状态
  const [baseCount, setBaseCount] = useState<number>(10);
  const [workerCount, setWorkerCount] = useState<number>(50);
  const [oneKeyLoading, setOneKeyLoading] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | undefined>(undefined);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/department`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params: { limit: 1000 }
      });
      setDepartments(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取部门失败');
    }
  };

  const fetchCodes = async (page = 1, pageSize = 50) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
        sort_by: 'department_id',
        order: 'asc',
      };
      if (filterDept) params.department_id = filterDept;
      if (selectedTask) params.task_id = selectedTask;
      const res = await axios.get(`${API_BASE}/api/admin/code`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params
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

  // 获取公司领导
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

  // 生成高层考核码
  const handleGenerateExecutiveCodes = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/code/generate-executive`, {}, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      });
      message.success(`${res.data.message} - 预期生成${leaders.length}个，实际生成${res.data.generated_count}个`);
      setTimeout(() => {
        fetchCodes();
        fetchCompanyLeaders();
      }, 500);
    } catch (err: any) {
      message.error(err.response?.data?.message || '生成高层考核码失败');
    } finally {
      setGenerating(false);
    }
  };

  // 一键生成考核码
  const handleOneKeyGenerate = async () => {
    if (!selectedTask) {
      message.warning('请先选择考核任务');
      return;
    }
    setOneKeyLoading(true);
    try {
      // 1. 生成高层考核码
      await handleGenerateExecutiveCodes();
      // 2. 生成部门id=2的中层管理人员考核码
      const [personRes, leaderRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/person`, {
          headers: { Authorization: `Bearer ${admin?.token}` },
          params: { status: 1, limit: 1000 }
        }),
        axios.get(`${API_BASE}/api/admin/person`, {
          headers: { Authorization: `Bearer ${admin?.token}` },
          params: { title: '公司领导', status: 1, limit: 1000 }
        })
      ]);
      const allPersons = personRes.data.data || [];
      const allLeaders = leaderRes.data.data || [];
      const midCount = allPersons.length - allLeaders.length;
      if (midCount > 0) {
        await axios.post(`${API_BASE}/api/admin/code/generate`, {
          department_id: 2,
          evaluator_type: '中层管理人员',
          weight: 1,
          count: midCount,
          task_id: selectedTask
        }, {
          headers: { Authorization: `Bearer ${admin?.token}` }
        });
      }
      // 3. 其他部门生成基层管理人员和职工代表考核码
      const deptRes = await axios.get(`${API_BASE}/api/admin/department`, {
        headers: { Authorization: `Bearer ${admin?.token}` },
        params: { limit: 1000 }
      });
      const departments = (deptRes.data.data || []).filter((d: any) => d.id !== 1 && d.id !== 2);
      for (const dept of departments) {
        if (baseCount > 0) {
          await axios.post(`${API_BASE}/api/admin/code/generate`, {
            department_id: dept.id,
            evaluator_type: '基层管理人员',
            weight: 1,
            count: baseCount,
            task_id: selectedTask
          }, {
            headers: { Authorization: `Bearer ${admin?.token}` }
          });
        }
        if (workerCount > 0) {
          await axios.post(`${API_BASE}/api/admin/code/generate`, {
            department_id: dept.id,
            evaluator_type: '职工代表',
            weight: 1,
            count: workerCount,
            task_id: selectedTask
          }, {
            headers: { Authorization: `Bearer ${admin?.token}` }
          });
        }
      }
      message.success('一键生成考核码完成！');
      fetchCodes();
      fetchCompanyLeaders();
    } catch (err: any) {
      message.error(err.response?.data?.message || '一键生成考核码失败');
    } finally {
      setOneKeyLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchDepartments();
      // 获取任务列表
      axios.get(`${API_BASE}/api/task`, {
        headers: { Authorization: `Bearer ${admin?.token}` }
      }).then(res => {
        setTasks(res.data.data || []);
        // 默认选中第一个“进行中”任务
        const running = (res.data.data || []).find((t: any) => t.status === '进行中');
        setSelectedTask(running?.id);
      });
      fetchCodes();
      fetchCompanyLeaders();
    }
    // eslint-disable-next-line
  }, [admin]);

  // 筛选部门时刷新表格
  useEffect(() => {
    if (admin) {
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchCodes(1, pagination.pageSize);
    }
    // eslint-disable-next-line
  }, [filterDept]);

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
      <div style={{ marginBottom: 16 }}>
        {/* 一键生成考核码分组 - 优化UI */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Select
            value={selectedTask}
            onChange={setSelectedTask}
            placeholder="请选择考核任务"
            style={{ width: 200, marginRight: 16 }}
          >
            {tasks.map(task => (
              <Select.Option key={task.id} value={task.id}>{task.name}</Select.Option>
            ))}
          </Select>
          <span style={{ fontWeight: 500, fontSize: 15 }}>每个部门生成：</span>
          <InputNumber min={1} max={100} value={baseCount} onChange={v => setBaseCount(v || 1)} style={{ width: 70 }} />
          <span>个基层管理人员考核码，</span>
          <InputNumber min={1} max={200} value={workerCount} onChange={v => setWorkerCount(v || 1)} style={{ width: 70 }} />
          <span>个职工代表考核码</span>
          <Button type="primary" loading={oneKeyLoading} onClick={handleOneKeyGenerate} style={{ marginLeft: 16 }} disabled={!selectedTask}>
            一键生成考核码
          </Button>
        </div>
        {/* 筛选分组 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>筛选部门：</span>
          <Select
            allowClear
            placeholder="全部"
            value={filterDept}
            onChange={setFilterDept}
            style={{ width: 200 }}
          >
            {departments
              .slice()
              .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
              .map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
          </Select>
        </div>
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