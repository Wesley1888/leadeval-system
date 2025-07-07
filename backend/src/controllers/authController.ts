import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import db from '../db';
import { UserLoginRequest, UserLoginResponse, AdminLoginRequest, AdminLoginResponse } from '../types';

const SECRET = process.env.JWT_SECRET || 'leadeval_secret';

export const login = async (req: Request<{}, {}, UserLoginRequest>, res: Response<UserLoginResponse>): Promise<void> => {
  const { code } = req.body;
  if (!code || code.length !== 8) {
    res.status(400).json({ success: false, message: '考核码格式错误' });
    return;
  }
  
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE code = ?', [code]) as [any[], any];
    if (rows.length === 0) {
      res.status(401).json({ success: false, message: '考核码不存在' });
      return;
    }
    
    // 匿名登录只返回必要信息
    const user = rows[0];
    res.json({ 
      success: true, 
      message: '登录成功',
      user: {
        id: user.id,
        code: user.code,
        username: user.name,
        department: user.department_id,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const adminLogin = async (req: Request<{}, {}, AdminLoginRequest>, res: Response<AdminLoginResponse>): Promise<void> => {
  const { code, password } = req.body;
  if (!code || !password) {
    res.status(400).json({ success: false, message: '账号或密码不能为空' });
    return;
  }
  
  try {
    const [rows] = await db.query('SELECT * FROM user WHERE code = ? AND role = "admin"', [code]) as [any[], any];
    if (rows.length === 0) {
      res.status(401).json({ success: false, message: '账号不存在或不是管理员' });
      return;
    }
    
    const user = rows[0];
    if (user.password !== password) {
      res.status(401).json({ success: false, message: '密码错误' });
      return;
    }
    
    // 生成token
    const token = jwt.sign({ code: user.code, role: user.role }, SECRET, { expiresIn: '2h' });
    res.json({ 
      success: true, 
      message: '登录成功',
      token, 
      admin: {
        id: user.id,
        username: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}; 