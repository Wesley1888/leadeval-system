import { Request, Response } from 'express';
import db from '../db';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query('SELECT id, name FROM department') as [any[], any];
    res.json({ success: true, data: rows });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const addDepartment = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ success: false, message: '部门名称不能为空' });
    return void 0;
  }
  try {
    const [result] = await db.query('INSERT INTO department (name) VALUES (?)', [name]) as [any, any];
    res.json({ success: true, id: result.insertId });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ success: false, message: '部门名称不能为空' });
    return void 0;
  }
  try {
    await db.query('UPDATE department SET name = ? WHERE id = ?', [name, id]);
    res.json({ success: true });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM department WHERE id = ?', [id]);
    res.json({ success: true });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
}; 