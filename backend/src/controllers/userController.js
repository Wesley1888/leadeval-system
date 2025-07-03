const db = require('../db');

exports.getUsersByDepartment = async (req, res) => {
  const { department_id } = req.query;
  if (!department_id) {
    return res.status(400).json({ message: '缺少部门ID' });
  }
  try {
    const [rows] = await db.query('SELECT code, name FROM user WHERE department_id = ?', [department_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 