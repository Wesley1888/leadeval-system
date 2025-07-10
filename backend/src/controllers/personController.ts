import { Request, Response } from 'express';
import db from '../db';

export const getPersonsByDepartment = async (req: Request, res: Response): Promise<void> => {
  const { department_id } = req.query;
  if (!department_id) {
    res.status(400).json({ message: '缺少部门ID' });
    return;
  }
  try {
    const [rows] = await db.query('SELECT id, name FROM person WHERE department_id = ?', [department_id]) as [any[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 