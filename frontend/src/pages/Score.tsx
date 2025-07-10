import React, { useEffect, useState } from 'react';
import { Table, InputNumber, Button, message, Tooltip, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// 被考核人类型
interface Target {
  id: number;
  name: string;
  [key: string]: any;
}

// 指标类型
interface Indicator {
  id: number;
  name: string;
  [key: string]: any;
}

type ScoresMap = {
  [targetCode: string]: {
    [indicatorId: number]: number;
  };
};

type TooltipOpenMap = {
  [key: string]: boolean;
};

const fixedScores = [10, 8, 6, 5];
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

const Score: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cardPaddingTop = 48; // 固定值，因为现在有固定的顶部导航
  const [targets, setTargets] = useState<Target[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [scores, setScores] = useState<ScoresMap>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [excellentLimit, setExcellentLimit] = useState<{ excellentScore: number; maxExcellent: number }>({ excellentScore: 90, maxExcellent: 3 });
  const [excellentCount, setExcellentCount] = useState<number>(0);
  const [exitLoading, setExitLoading] = useState<boolean>(false);
  const [tooltipOpen, setTooltipOpen] = useState<TooltipOpenMap>({});
  const tooltipTimers = React.useRef<{ [key: string]: any }>({});
  const tooltipHover = React.useRef<{ [key: string]: boolean }>({});

  // 获取本单位所有被考核人
  useEffect(() => {
    if (user?.department_id) {
      axios.get(`${API_BASE}/api/person?department_id=${user.department_id}`)
        .then(res => setTargets((res.data as Target[])))
        .catch(() => message.error('获取被考核人失败'));
    }
  }, [user]);

  // 获取考核指标
  useEffect(() => {
    axios.get(`${API_BASE}/api/indicators`)
      .then(res => setIndicators(res.data))
      .catch(() => message.error('获取考核指标失败'));
  }, []);

  // 获取优秀分数线和允许人数
  useEffect(() => {
    axios.get(`${API_BASE}/api/score/limit`)
      .then(res => setExcellentLimit(res.data))
      .catch(() => {});
  }, []);

  // 统计优秀人数
  useEffect(() => {
    if (targets.length && indicators.length) {
      let count = 0;
      for (const target of targets) {
        let total = 0;
        for (const ind of indicators) {
          const v = scores[target.id]?.[ind.id];
          if (typeof v === 'number') total += v;
        }
        if (total >= excellentLimit.excellentScore) count++;
      }
      setExcellentCount(count);
    }
  }, [scores, targets, indicators, excellentLimit]);

  // 加载已保存分数
  useEffect(() => {
    if (user?.code && indicators.length && targets.length) {
      axios.get(`${API_BASE}/api/score/self`, {
        params: { code_id: user.code, year: new Date().getFullYear() + 1 }
      }).then(res => {
        const map: ScoresMap = {};
        for (const row of res.data as any[]) {
          if (!map[row.person_id]) map[row.person_id] = {};
          map[row.person_id][row.indicator_id] = row.score;
        }
        setScores(map);
      });
    }
  }, [user, indicators, targets]);

  // 分数变更
  const handleScoreChange = (targetCode: string, indicatorId: number, value: number) => {
    setScores(prev => ({
      ...prev,
      [targetCode]: {
        ...(prev[targetCode] || {}),
        [indicatorId]: value
      }
    }));
  };

  // 判断是否全部打完分
  const allFilled = targets.length > 0 && indicators.length > 0 && targets.every(target =>
    indicators.every(ind => typeof scores[target.id]?.[ind.id] === 'number')
  );

  // 提交打分
  const handleSubmit = async () => {
    setLoading(true);
    try {
      for (const target of targets) {
        for (const indicator of indicators) {
          const score = scores[target.id]?.[indicator.id];
          if (score == null) continue;
          await axios.post(`${API_BASE}/api/score`, {
            code_id: user!.code,
            person_id: target.id,
            indicator_id: indicator.id,
            score,
            year: new Date().getFullYear() + 1 // 例如2025
          });
        }
      }
      
      // 标记考核码为已使用
      await axios.post(`${API_BASE}/api/mark-used`, { code: user!.code });
      
      message.success('打分成功，考核码已标记为已使用');
      setScores({});
      logout();
      navigate('/login');
    } catch {
      message.error('打分失败');
    } finally {
      setLoading(false);
    }
  };

  // 暂存退出逻辑
  const handleExit = async () => {
    setExitLoading(true);
    try {
      for (const target of targets) {
        for (const indicator of indicators) {
          const score = scores[target.id]?.[indicator.id];
          if (score == null) continue;
          await axios.post(`${API_BASE}/api/score`, {
            code_id: user!.code,
            person_id: target.id,
            indicator_id: indicator.id,
            score,
            year: new Date().getFullYear() + 1
          });
        }
      }
    } catch {
      // 可选：message.error('暂存失败');
    } finally {
      setExitLoading(false);
      logout();
      navigate('/login');
    }
  };

  const handleTooltipVisible = (key: string, visible: boolean) => {
    if (visible) {
      if (tooltipTimers.current[key]) {
        clearTimeout(tooltipTimers.current[key]);
        tooltipTimers.current[key] = null;
      }
      setTooltipOpen(prev => ({ ...prev, [key]: true }));
    } else {
      // 只有在不悬停在按钮上时才关闭
      tooltipTimers.current[key] = setTimeout(() => {
        if (!tooltipHover.current[key]) {
          setTooltipOpen(prev => ({ ...prev, [key]: false }));
        }
      }, 500);
    }
  };

  // 悬浮按钮区域鼠标事件
  const handleTooltipContentEnter = (key: string) => {
    tooltipHover.current[key] = true;
    if (tooltipTimers.current[key]) {
      clearTimeout(tooltipTimers.current[key]);
      tooltipTimers.current[key] = null;
    }
    setTooltipOpen(prev => ({ ...prev, [key]: true }));
  };
  const handleTooltipContentLeave = (key: string) => {
    tooltipHover.current[key] = false;
    tooltipTimers.current[key] = setTimeout(() => {
      setTooltipOpen(prev => ({ ...prev, [key]: false }));
    }, 500);
  };

  // 构造表格数据
  const dataSource = targets.map(target => ({
    key: target.id,
    name: target.name,
    ...Object.fromEntries(
      indicators.map(ind => {
        const tooltipKey = `${target.id}_${ind.id}`;
        return [
          `indicator_${ind.id}`,
          <Tooltip
            key={tooltipKey}
            title={
              <div
                onMouseEnter={() => handleTooltipContentEnter(tooltipKey)}
                onMouseLeave={() => handleTooltipContentLeave(tooltipKey)}
              >
                {fixedScores.map(fs => (
                  <Button
                    key={fs}
                    size="small"
                    style={{ margin: '0 2px', minWidth: 30, textAlign: 'center', padding: '0 4px', fontWeight: 600 }}
                    onClick={() => handleScoreChange(String(target.id), ind.id, fs)}
                  >{fs}</Button>
                ))}
              </div>
            }
            open={tooltipOpen[tooltipKey]}
            onOpenChange={visible => handleTooltipVisible(tooltipKey, visible)}
          >
            <span
              onMouseEnter={() => handleTooltipVisible(tooltipKey, true)}
              onMouseLeave={() => handleTooltipVisible(tooltipKey, false)}
            >
              <InputNumber
                min={0}
                max={ind.max_score}
                value={scores[target.id]?.[ind.id]}
                onChange={val => handleScoreChange(String(target.id), ind.id, val)}
                style={{ width: 80 }}
                placeholder={`满分${ind.max_score}`}
              />
            </span>
          </Tooltip>
        ];
      })
    )
  }));

  // 构造表格列
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 100
    },
    ...indicators.map(ind => ({
      title: ind.name,
      dataIndex: `indicator_${ind.id}`,
      key: `indicator_${ind.id}`,
      width: 130
    }))
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', overflow: 'auto' }}>
      {/* 顶部导航栏 */}
      <div style={{ position: 'fixed', top: 24, right: 24, padding: 12, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <span style={{ marginRight: 16 }}>当前考核码：{user!.code}</span>
        <Button onClick={() => { logout(); navigate('/login'); }}>退出登录</Button>
      </div>
      
      <div style={{
        maxWidth: 900,
        margin: '40px auto',
        marginTop: 100,
        background: '#fff',
        padding: 24,
        paddingTop: cardPaddingTop,
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        minHeight: '70vh',
        position: 'relative',
        overflowX: 'auto'
      }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, fontSize: 22, color: '#1976a1' }}>中层管理人员考核打分</h2>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        scroll={{ x: 'max-content' }}
        style={{ marginBottom: 16, minWidth: 320 }}
        size="middle"
      />
      {/* 按钮区：未全部打完分时只显示暂存退出，全部打完后只显示提交打分 */}
      {!allFilled ? (
        <Button
          type="default"
          block
          onClick={handleExit}
          loading={exitLoading}
          style={{ background: '#faad14', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16, borderRadius: 8, marginBottom: 8 }}
        >
          暂存退出
        </Button>
      ) : (
        <Button type="primary" block onClick={handleSubmit} loading={loading} disabled={excellentCount > excellentLimit.maxExcellent} style={{ fontWeight: 600, fontSize: 16, borderRadius: 8, marginBottom: 8 }}>
          提交并完成退出
        </Button>
      )}
      {excellentCount > excellentLimit.maxExcellent && (
        <Alert type="error" showIcon style={{marginTop:8}} message={`优秀人数已超出限制（最多${excellentLimit.maxExcellent}人，当前${excellentCount}人）`} />
      )}
      </div>
    </div>
  );
};

export default Score; 