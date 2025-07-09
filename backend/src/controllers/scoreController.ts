import { Request, Response, RequestHandler } from 'express';
import db from '../db';
import ExcelJS from 'exceljs';

interface SubmitScoreRequest {
  scorer_code: string;
  target_id: number;
  indicator_id: number;
  score: number;
  year: number;
}

interface ScoreQuery {
  scorer_code?: string;
  year?: string;
  code?: string;
}

export const submitScore = async (req, res) => {
  const { scorer_code, target_id, indicator_id, score, year } = req.body;
  if (!scorer_code || !target_id || !indicator_id || !score || !year) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    await db.query(
      'INSERT INTO score (scorer_code, target_id, indicator_id, score, year) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)',
      [scorer_code, target_id, indicator_id, score, year]
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
  const { scorer_code, year } = req.query;
  if (!scorer_code || !year) {
    res.status(400).json({ message: '参数不完整' });
    return;
  }
  
  try {
    const [rows] = await db.query(
      'SELECT * FROM score WHERE scorer_code = ? AND year = ?',
      [scorer_code, year]
    ) as [any[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

export const exportScoresExcel: RequestHandler = async (req, res, next) => {
  const { year } = req.query;
  try {
    const [rows] = await db.query(`
      SELECT s.scorer_code, s.target_id, p.name AS target_name, s.indicator_id, i.name AS indicator_name, s.score, s.year
      FROM score s
      LEFT JOIN person p ON s.target_id = p.id
      LEFT JOIN indicator i ON s.indicator_id = i.id
      WHERE s.year = ?
      ORDER BY s.scorer_code, s.target_id, s.indicator_id
    `, [year || new Date().getFullYear() + 1]) as [any[], any];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scores');
    worksheet.columns = [
      { header: '打分人考核码', key: 'scorer_code', width: 15 },
      { header: '被考核人ID', key: 'target_id', width: 15 },
      { header: '被考核人姓名', key: 'target_name', width: 15 },
      { header: '指标ID', key: 'indicator_id', width: 10 },
      { header: '指标名称', key: 'indicator_name', width: 15 },
      { header: '分数', key: 'score', width: 10 },
      { header: '年份', key: 'year', width: 10 }
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
    const [rows] = await db.query('SELECT * FROM score WHERE year = ?', [year]) as [any[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

export const getScoreStat = async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ message: '参数不完整' });
  try {
    const [rows] = await db.query(`
      SELECT p.id as target_id, p.name as target_name, d.id as department, d.name as department_name,
             s.indicator_id, SUM(s.score) as score
      FROM score s
      LEFT JOIN person p ON s.target_id = p.id
      LEFT JOIN department d ON p.department = d.id
      WHERE s.year = ?
      GROUP BY s.target_id, s.indicator_id
    `, [year]) as [any[], any];
    // 整理为每人一行
    const statMap = {};
    for (const row of rows) {
      if (!statMap[row.target_id]) {
        statMap[row.target_id] = {
          target_id: row.target_id,
          target_name: row.target_name,
          department: row.department,
          department_name: row.department_name,
          scores: {},
          total: 0
        };
      }
      statMap[row.target_id].scores[row.indicator_id] = row.score;
      statMap[row.target_id].total += row.score;
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
  const { scorer_code, year } = req.query;
  if (!scorer_code || !year) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM score WHERE scorer_code = ? AND year = ?',
      [scorer_code, year]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};