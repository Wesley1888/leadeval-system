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
  const { code_id, person_id, indicator_id, score, year } = req.body;
  if (!code_id || !person_id || !indicator_id || !score || !year) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    await db.query(
      'INSERT INTO score (code_id, person_id, indicator_id, score, year) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score)',
      [code_id, person_id, indicator_id, score, year]
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
      'SELECT * FROM score WHERE code_id = ? AND year = ?',
      [code_id, year]
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
      SELECT s.code_id, s.person_id, p.name AS person_name, s.indicator_id, i.name AS indicator_name, s.score, s.year
      FROM score s
      LEFT JOIN person p ON s.person_id = p.id
      LEFT JOIN indicator i ON s.indicator_id = i.id
      WHERE s.year = ?
      ORDER BY s.code_id, s.person_id, s.indicator_id
    `, [year || new Date().getFullYear() + 1]) as [any[], any];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scores');
    worksheet.columns = [
      { header: '打分人考核码', key: 'code_id', width: 15 },
      { header: '被考核人ID', key: 'person_id', width: 15 },
      { header: '被考核人姓名', key: 'person_name', width: 15 },
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
      SELECT p.id as person_id, p.name as person_name, d.id as department_id, d.name as department_name,
             s.indicator_id, SUM(s.score) as score
      FROM score s
      LEFT JOIN person p ON s.person_id = p.id
      LEFT JOIN department d ON p.department_id = d.id
      WHERE s.year = ?
      GROUP BY s.person_id, s.indicator_id
    `, [year]) as [any[], any];
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
      statMap[row.person_id].total += row.score;
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
  const { code_id, year } = req.query;
  if (!code_id || !year) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM score WHERE code_id = ? AND year = ?',
      [code_id, year]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};