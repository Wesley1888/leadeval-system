import { Request, Response } from 'express';
import db from '../db';

interface GetUsersQuery {
  department_id: string;
}

export const getUsersByDepartment = async (req: Request<{}, {}, {}, GetUsersQuery>, res: Response): Promise<void> => {
  const { department_id } = req.query;
  if (!department_id) {
    res.status(400).json({ message: '缺少部门ID' });
    return;
  }
  
  try {
    const [rows] = await db.query('SELECT code, name FROM user WHERE department_id = ?', [department_id]) as [any[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 