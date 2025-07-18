import { Request, Response } from 'express';
import db from '../db';

// 获取考核任务列表（支持分页、筛选、排序）
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, keyword, status, year, sort_by = 'created_at', order = 'desc' } = req.query as any;
    let query = 'SELECT * FROM evaluation_tasks WHERE 1=1';
    const params: any[] = [];
    if (keyword) {
      query += ' AND name LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }
    query += ` ORDER BY ${sort_by} ${order === 'asc' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const [rows] = await db.query(query, params) as [any[], any];
    const [countRows] = await db.query('SELECT COUNT(*) as total FROM evaluation_tasks WHERE 1=1' + (keyword ? ' AND name LIKE ?' : '') + (status ? ' AND status = ?' : '') + (year ? ' AND year = ?' : ''), params.slice(0, params.length - 2)) as [any[], any];
    res.json({ data: rows, total: countRows[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 新建考核任务
export const createTask = async (req: Request, res: Response) => {
  try {
    const { name, year, start_date, end_date, status, description, created_by } = req.body;
    if (!name || !year || !start_date || !end_date || !created_by) {
      res.status(400).json({ message: '缺少必填字段' });
      return;
    }
    const [result] = await db.query(
      'INSERT INTO evaluation_tasks (name, year, start_date, end_date, status, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, year, start_date, end_date, status || 1, description || '', created_by]
    ) as [any, any];
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 编辑考核任务
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, year, start_date, end_date, status, description } = req.body;
    if (!name || !year || !start_date || !end_date) {
      res.status(400).json({ message: '缺少必填字段' });
      return;
    }
    const [result] = await db.query(
      'UPDATE evaluation_tasks SET name=?, year=?, start_date=?, end_date=?, status=?, description=?, updated_at=NOW() WHERE id=?',
      [name, year, start_date, end_date, status || 1, description || '', id]
    ) as [any, any];
    if (result.affectedRows === 0) {
      res.status(404).json({ message: '考核任务不存在' });
      return;
    }
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除考核任务
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM evaluation_tasks WHERE id=?', [id]) as [any, any];
    if (result.affectedRows === 0) {
      res.status(404).json({ message: '考核任务不存在' });
      return;
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 