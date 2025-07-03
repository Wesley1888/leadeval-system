const jwt = require('jsonwebtoken');
const SECRET = 'leadeval_secret';

function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未授权' });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '无管理员权限' });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'token无效或过期' });
  }
}

module.exports = adminAuth; 