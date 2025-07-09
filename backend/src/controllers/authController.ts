import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import db from '../db';
import { AdminLoginRequest, AdminLoginResponse } from '../types';

const SECRET = process.env.JWT_SECRET || 'leadeval_secret';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;
  if (!code || code.length !== 8) {
    res.status(400).json({ success: false, message: '考核码格式错误' });
    return;
  }
  try {
    const [rows] = await db.query('SELECT * FROM code WHERE code = ?', [code]) as [any[], any];
    if (rows.length === 0) {
      res.status(401).json({ success: false, message: '考核码不存在' });
      return;
    }
    const codeRow = rows[0];
    
    // 检查考核码是否已被使用
    if (codeRow.used === 1) {
      res.status(401).json({ success: false, message: '该考核码已完成打分，无法再次使用' });
      return;
    }
    
    res.json({
      success: true,
      message: '登录成功',
      user: {
        code: codeRow.code,
        department: codeRow.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { name, password } = req.body;
  if (!name || !password) {
    res.status(400).json({ success: false, message: '账号或密码不能为空' });
    return;
  }
  try {
    const [rows] = await db.query('SELECT * FROM admin WHERE name = ?', [name]) as [any[], any];
    if (rows.length === 0) {
      res.status(401).json({ success: false, message: '账号不存在' });
      return;
    }
    const admin = rows[0];
    if (admin.password !== password) {
      res.status(401).json({ success: false, message: '密码错误' });
      return;
    }
    const token = jwt.sign({ id: admin.id, role: admin.role }, SECRET, { expiresIn: '2h' });
    res.json({
      success: true,
      message: '登录成功',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}; 

export const markCodeAsUsed = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ success: false, message: '考核码不能为空' });
    return;
  }
  try {
    const [result] = await db.query('UPDATE code SET used = 1 WHERE code = ?', [code]) as [any, any];
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: '考核码不存在' });
      return;
    }
    res.json({ success: true, message: '考核码已标记为已使用' });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}; 