import { Request, Response, RequestHandler } from 'express';
import db from '../db';
import ExcelJS from 'exceljs';

interface SubmitScoreRequest {
  code_id: string;
  person_id: number;
  indicator_id: number;
  score: number;
  year: number;
}

interface ScoreQuery {
  code_id?: string;
  year?: string;
  code?: string;
}

export const submitScore = async (req, res) => {
  const { evaluator_code, person_id, indicator_id, score } = req.body;
  // 允许前端传递 task_id、level、comment，否则给默认值
  const task_id = req.body.task_id || 1;
  const level = req.body.level || '一般';
  const comment = req.body.comment || null;
  if (!evaluator_code || !person_id || !indicator_id || !score) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    await db.query(
      'INSERT INTO scores (task_id, evaluator_code, person_id, indicator_id, score, level, comment) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score), level = VALUES(level), comment = VALUES(comment)',
      [task_id, evaluator_code, person_id, indicator_id, score, level, comment]
    );
    res.json({ success: true, message: '打分成功' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

export const getExcellentLimit = (req: Request, res: Response): void => {
  res.json({
    excellentScore: 90, // 优秀分数线
    maxExcellent: 3    // 允许优秀人数
  });
};

export const getScoresByScorer: RequestHandler = async (req, res, next) => {
  const { code_id, year } = req.query;
  if (!code_id || !year) {
    res.status(400).json({ message: '参数不完整' });
    return;
  }
  
  try {
    const [rows] = await db.query(
      'SELECT * FROM scores WHERE code_id = ? AND year = ?',
      [code_id, year]
    ) as [any[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

export const exportScoresExcel: RequestHandler = async (req, res, next) => {
  const { department_id } = req.query;
  try {
    let query = `
      SELECT s.evaluator_code, p.id as person_id, p.name AS person_name, d.id as department_id, d.name as department_name,
             s.indicator_id, i.name AS indicator_name, s.score
      FROM scores s
      LEFT JOIN persons p ON s.person_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN evaluation_indicators i ON s.indicator_id = i.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (department_id) {
      query += ' AND d.id = ?';
      params.push(department_id);
    }
    query += ' ORDER BY s.evaluator_code, s.person_id, s.indicator_id';
    const [rows] = await db.query(query, params) as [any[], any];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scores');
    worksheet.columns = [
      { header: '打分人考核码', key: 'evaluator_code', width: 15 },
      { header: '被考核人ID', key: 'person_id', width: 15 },
      { header: '被考核人姓名', key: 'person_name', width: 15 },
      { header: '部门ID', key: 'department_id', width: 15 },
      { header: '部门名称', key: 'department_name', width: 15 },
      { header: '指标ID', key: 'indicator_id', width: 10 },
      { header: '指标名称', key: 'indicator_name', width: 15 },
      { header: '分数', key: 'score', width: 10 }
    ];
    worksheet.addRows(rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="scores.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: '导出失败' });
  }
};

export const getAllScores: RequestHandler = async (req, res, next) => {
  const { year } = req.query;
  if (!year) {
    res.status(400).json({ message: '参数不完整' });
    return;
  }
  
  try {
    const [rows] = await db.query('SELECT * FROM scores WHERE year = ?', [year]) as [any[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

export const getScoreStat = async (req, res) => {
  const { department_id } = req.query;
  try {
    let query = `
      SELECT p.id as person_id, p.name as person_name, d.id as department_id, d.name as department_name,
             s.indicator_id, SUM(s.score) as score
      FROM scores s
      LEFT JOIN persons p ON s.person_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (department_id) {
      query += ' AND d.id = ?';
      params.push(department_id);
    }
    query += ' GROUP BY s.person_id, s.indicator_id';
    const [rows] = await db.query(query, params) as [any[], any];
    // 整理为每人一行
    const statMap = {};
    for (const row of rows) {
      if (!statMap[row.person_id]) {
        statMap[row.person_id] = {
          person_id: row.person_id,
          person_name: row.person_name,
          department_id: row.department_id,
          department_name: row.department_name,
          scores: {},
          total: 0
        };
      }
      statMap[row.person_id].scores[row.indicator_id] = row.score;
      statMap[row.person_id].total += Number(row.score)||0;
    }
    // 计算平均分
    const result = Object.values(statMap).map(item => {
      const stat = item as { scores: Record<string, number>; total: number };
      return {
        ...stat,
        average: Object.keys(stat.scores).length
          ? (stat.total / Object.keys(stat.scores).length).toFixed(2)
          : 0
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

export const getSelfScores = async (req, res) => {
  const { evaluator_code } = req.query;
  if (!evaluator_code) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM scores WHERE evaluator_code = ?',
      [evaluator_code]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 批量提交分数
export const batchSubmitScores = async (req, res) => {
  const { scores } = req.body;
  if (!Array.isArray(scores) || scores.length === 0) {
    return res.status(400).json({ message: '没有需要提交的分数' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of scores) {
      if (!item.evaluator_code || !item.person_id || !item.indicator_id || item.score === undefined) continue;
      await conn.query(
        'INSERT INTO scores (task_id, evaluator_code, person_id, indicator_id, score, level, comment) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score), level = VALUES(level), comment = VALUES(comment)',
        [item.task_id || 1, item.evaluator_code, item.person_id, item.indicator_id, item.score, item.level || '一般', item.comment || null]
      );
    }
    await conn.commit();
    res.json({ success: true, message: '批量打分成功' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: '批量打分失败' });
  } finally {
    conn.release();
  }
};