import { Request, Response } from 'express';
import db from '../db';

export const getPersons = async (req: Request, res: Response): Promise<void> => {
  const { department_id } = req.query;
  try {
    let rows;
    if (department_id) {
      [rows] = await db.query('SELECT id, name, department_id FROM persons WHERE department_id = ?', [department_id]) as [any[], any];
    } else {
      [rows] = await db.query('SELECT id, name, department_id FROM persons') as [any[], any];
    }
    res.json({ success: true, data: rows });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const addPerson = async (req: Request, res: Response): Promise<void> => {
  const { name, department_id } = req.body;
  if (!name || !department_id) {
    res.status(400).json({ success: false, message: '姓名和部门ID不能为空' });
    return void 0;
  }
  try {
    const [result] = await db.query('INSERT INTO persons (name, department_id) VALUES (?, ?)', [name, department_id]) as [any, any];
    res.json({ success: true, id: result.insertId });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const updatePerson = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, department_id } = req.body;
  if (!name || !department_id) {
    res.status(400).json({ success: false, message: '姓名和部门ID不能为空' });
    return void 0;
  }
  try {
    await db.query('UPDATE persons SET name = ?, department_id = ? WHERE id = ?', [name, department_id, id]);
    res.json({ success: true });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const deletePerson = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM persons WHERE id = ?', [id]);
    res.json({ success: true });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
}; 