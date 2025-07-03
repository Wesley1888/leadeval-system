const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = 'leadeval_secret'; // 可放到环境变量

exports.login = async (req, res) => {
  const { code } = req.body;
  if (!code || code.length !== 8) {
    return res.status(400).json({ message: '考核码格式错误' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE code = ?', [code]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '考核码不存在' });
    }
    // 匿名登录只返回必要信息
    const user = rows[0];
    res.json({ code: user.code, name: user.name, department_id: user.department_id });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

exports.adminLogin = async (req, res) => {
  const { code, password } = req.body;
  if (!code || !password) {
    return res.status(400).json({ message: '账号或密码不能为空' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE code = ? AND role = "admin"', [code]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '账号不存在或不是管理员' });
    }
    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ message: '密码错误' });
    }
    // 生成token
    const token = jwt.sign({ code: user.code, role: user.role }, SECRET, { expiresIn: '2h' });
    res.json({ token, code: user.code, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 