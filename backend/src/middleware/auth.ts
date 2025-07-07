import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { JWTPayload, AuthenticatedRequest } from '../types';

const SECRET = process.env.JWT_SECRET || 'leadeval_secret';

const adminAuth: RequestHandler = (req, res, next) => {
  const auth = (req.headers as any).authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ message: '未授权' });
    return;
  }
  
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({ message: '无管理员权限' });
      return;
    }
    (req as unknown as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'token无效或过期' });
  }
}

export default adminAuth; 