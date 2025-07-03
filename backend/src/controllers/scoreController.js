const db = require('../db');
const ExcelJS = require('exceljs');

exports.submitScore = async (req, res) => {
  const { scorer_code, target_code, indicator_id, score, year } = req.body;
  if (!scorer_code || !target_code || !indicator_id || !score || !year) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    // 判断是否已存在该打分记录
    const [rows] = await db.query(
      'SELECT id FROM score WHERE scorer_code = ? AND target_code = ? AND indicator_id = ? AND year = ?',
      [scorer_code, target_code, indicator_id, year]
    );
    if (rows.length > 0) {
      // 已存在则更新
      await db.query(
        'UPDATE score SET score = ? WHERE id = ?',
        [score, rows[0].id]
      );
    } else {
      // 不存在则插入
      await db.query(
        'INSERT INTO score (scorer_code, target_code, indicator_id, score, year) VALUES (?, ?, ?, ?, ?)',
        [scorer_code, target_code, indicator_id, score, year]
      );
    }
    res.json({ message: '打分成功' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getExcellentLimit = (req, res) => {
  res.json({
    excellentScore: 90, // 优秀分数线
    maxExcellent: 3    // 允许优秀人数
  });
};

exports.getScoresByScorer = async (req, res) => {
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

exports.exportScoresExcel = async (req, res) => {
  const { year } = req.query;
  try {
    const [rows] = await db.query(`
      SELECT s.scorer_code, su.name AS scorer_name, s.target_code, tu.name AS target_name, s.indicator_id, i.name AS indicator_name, s.score, s.year
      FROM score s
      LEFT JOIN user su ON s.scorer_code = su.code
      LEFT JOIN user tu ON s.target_code = tu.code
      LEFT JOIN indicator i ON s.indicator_id = i.id
      WHERE s.year = ?
      ORDER BY s.scorer_code, s.target_code, s.indicator_id
    `, [year || new Date().getFullYear() + 1]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scores');
    worksheet.columns = [
      { header: '打分人考核码', key: 'scorer_code', width: 15 },
      { header: '打分人姓名', key: 'scorer_name', width: 15 },
      { header: '被考核码', key: 'target_code', width: 15 },
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

exports.getAllScores = async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ message: '参数不完整' });
  try {
    const [rows] = await db.query('SELECT * FROM score WHERE year = ?', [year]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getScoreStat = async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ message: '参数不完整' });
  try {
    const [rows] = await db.query(`
      SELECT u.code as target_code, u.name as target_name, d.id as department_id, d.name as department_name,
             s.indicator_id, SUM(s.score) as score
      FROM score s
      LEFT JOIN user u ON s.target_code = u.code
      LEFT JOIN department d ON u.department_id = d.id
      WHERE s.year = ?
      GROUP BY s.target_code, s.indicator_id
    `, [year]);
    // 整理为每人一行
    const statMap = {};
    for (const row of rows) {
      if (!statMap[row.target_code]) {
        statMap[row.target_code] = {
          target_code: row.target_code,
          target_name: row.target_name,
          department_id: row.department_id,
          department_name: row.department_name,
          scores: {},
          total: 0
        };
      }
      statMap[row.target_code].scores[row.indicator_id] = row.score;
      statMap[row.target_code].total += row.score;
    }
    // 计算平均分
    const result = Object.values(statMap).map(item => ({
      ...item,
      average: Object.keys(item.scores).length
        ? (item.total / Object.keys(item.scores).length).toFixed(2)
        : 0
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.getSelfScores = async (req, res) => {
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

exports.checkFinished = async (req, res) => {
  const { code, year } = req.query;
  if (!code || !year) return res.status(400).json({ message: '参数不完整' });
  // 获取该考核码所在部门所有被考核人和所有指标
  const [[user]] = await db.query('SELECT department_id FROM user WHERE code = ?', [code]);
  if (!user) return res.status(404).json({ message: '考核码不存在' });
  const [targets] = await db.query('SELECT code FROM user WHERE department_id = ? AND code != ?', [user.department_id, code]);
  const [indicators] = await db.query('SELECT id FROM indicator');
  const needCount = targets.length * indicators.length;
  const [scores] = await db.query(
    'SELECT COUNT(*) as cnt FROM score WHERE scorer_code = ? AND year = ?',
    [code, year]
  );
  res.json({ finished: scores[0].cnt >= needCount });
}; 