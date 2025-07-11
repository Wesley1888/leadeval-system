import { Request, Response } from 'express';
import db from '../db';

function randomCode(length = 8) {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const getCodes = async (req: Request, res: Response): Promise<void> => {
  const { department_id } = req.query;
  try {
    let rows;
    if (department_id) {
      [rows] = await db.query('SELECT id, department_id, role, used FROM code WHERE department_id = ?', [department_id]) as [any[], any];
    } else {
      [rows] = await db.query('SELECT id, department_id, role, used FROM code') as [any[], any];
    }
    res.json({ success: true, data: rows });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const generateCodes = async (req: Request, res: Response): Promise<void> => {
  const { department_id, count, role = '一般员工' } = req.body;
  if (!department_id || !count || count < 1) {
    res.status(400).json({ success: false, message: '部门ID和数量不能为空' });
    return void 0;
  }
  try {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let code;
      // 保证唯一性
      do {
        code = randomCode(8);
        const [rows] = await db.query('SELECT id FROM code WHERE id = ?', [code]) as [any[], any];
        if (rows.length === 0) break;
      } while (true);
      await db.query('INSERT INTO code (id, department_id, role, used) VALUES (?, ?, ?, 0)', [code, department_id, role]);
      codes.push(code);
    }
    res.json({ success: true, codes });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
}; 