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
interface EvaluationIndicator {
  id: number;
  name: string;
  category: string;
  weight: number;
  description?: string;
  status: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  const [indicators, setIndicators] = useState<EvaluationIndicator[]>([]);
  const [scores, setScores] = useState<ScoresMap>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [excellentLimit, setExcellentLimit] = useState<{ excellentScore: number; maxExcellent: number }>({ excellentScore: 90, maxExcellent: 3 });
  const [excellentCount, setExcellentCount] = useState<number>(0);
  const [exitLoading, setExitLoading] = useState<boolean>(false);
  const [tooltipOpen, setTooltipOpen] = useState<TooltipOpenMap>({});
  const tooltipTimers = React.useRef<{ [key: string]: any }>({});
  const tooltipHover = React.useRef<{ [key: string]: boolean }>({});
  // 新增：记录初始分数
  const [initialScores, setInitialScores] = useState<ScoresMap>({});

  // 获取本单位所有被考核人
  useEffect(() => {
    if (user?.department_id) {
      axios.get(`${API_BASE}/api/person?department_id=${user.department_id}`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setTargets(res.data);
          } else if (Array.isArray(res.data.data)) {
            setTargets(res.data.data);
          } else {
            setTargets([]);
          }
        })
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

  // 加载已保存分数时，记录初始分数
  useEffect(() => {
    if (user?.code && indicators.length && targets.length) {
      axios.get(`${API_BASE}/api/score/self`, {
        params: { evaluator_code: user.code }
      }).then(res => {
        const map: ScoresMap = {};
        for (const row of res.data as any[]) {
          if (!map[row.person_id]) map[row.person_id] = {};
          map[row.person_id][row.indicator_id] = row.score;
        }
        setScores(map);
        setInitialScores(map); // 记录初始分数
      });
    }
  }, [user, indicators, targets]);

  // 新增：获取有修改的分数
  const getChangedScores = () => {
    const changed: any[] = [];
    targets.forEach(target => {
      indicators.forEach(ind => {
        const tKey = String(target.id);
        const newVal = scores[tKey]?.[ind.id];
        const oldVal = initialScores[tKey]?.[ind.id];
        if (
          newVal !== undefined &&
          newVal !== null &&
          String(newVal).trim() !== '' &&
          String(newVal) !== String(oldVal)
        ) {
          changed.push({
            evaluator_code: user!.code,
            person_id: target.id,
            indicator_id: ind.id,
            score: newVal,
            task_id: 1,
            level: '一般',
            comment: null
          });
        }
      });
    });
    return changed;
  };

  // 批量提交打分
  const submitBatchScores = async () => {
    const changedScores = getChangedScores();
    if (changedScores.length === 0) return;
    await axios.post(`${API_BASE}/api/score/batch`, { scores: changedScores });
  };

  // 分数变更
  const handleScoreChange = (targetCode: string | number, indicatorId: number, value: number | string | null) => {
    const tKey = String(targetCode);
    setScores(prev => ({
      ...prev,
      [tKey]: {
        ...(prev[tKey] || {}),
        [indicatorId]: value === null ? 0 : Number(value)
      }
    }));
  };

  const allFilled = targets.length > 0 && indicators.length > 0 && targets.every(target =>
    indicators.every(ind => {
      const val = scores[String(target.id)]?.[ind.id];
      return val !== undefined && val !== null && String(val).trim() !== '';
    })
  );

  // 修改 handleSubmit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitBatchScores();
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

  // 修改 handleExit
  const handleExit = async () => {
    setExitLoading(true);
    try {
      await submitBatchScores();
    } catch {}
    finally {
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
                max={ind.weight}
                value={scores[String(target.id)]?.[ind.id]}
                onChange={val => handleScoreChange(target.id, ind.id, typeof val === 'number' ? val : 0)}
                style={{ width: 80 }}
                precision={0}
                step={1}
                stringMode={false}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`${Math.round(ind.weight)}`}
              />
            </span>
          </Tooltip>
        ];
      })
    )
  }));

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
    <div style={{ padding: '0 20px', marginTop: cardPaddingTop }}>
      <h1>打分系统</h1>
      <Alert
        message={`当前优秀分数线: ${excellentLimit.excellentScore}分，允许优秀人数: ${excellentLimit.maxExcellent}人`}
        type="info"
        showIcon
      />
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        loading={loading || exitLoading}
        rowKey="key"
        bordered
      />
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Button onClick={handleExit} loading={exitLoading} danger>
          退出
        </Button>
        <Button onClick={handleSubmit} loading={loading} style={{ marginLeft: 10 }} disabled={!allFilled}>
          提交打分
        </Button>
      </div>
    </div>
  );
};

export default Score;