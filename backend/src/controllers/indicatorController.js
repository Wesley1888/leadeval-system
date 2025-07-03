const db = require('../db');

exports.getIndicators = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM indicator');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 