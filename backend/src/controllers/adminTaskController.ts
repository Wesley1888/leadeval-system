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
    const taskId = result.insertId;

    // 快照所有有效人员
    const [persons] = await db.query(
      `SELECT p.id as person_id, p.name as person_name, p.department_id, d.name as department_name, p.title as role
       FROM persons p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.status = 1`
    ) as [any[], any];
    if (persons.length > 0) {
      const personValues = persons.map((p: any) => [taskId, p.person_id, p.department_id, p.person_name, p.department_name, p.role]);
      await db.query(
        'INSERT INTO evaluation_task_persons (task_id, person_id, department_id, person_name, department_name, role) VALUES ?',
        [personValues]
      );
    }

    // 快照所有有效部门
    const [departments] = await db.query(
      `SELECT id as department_id, name as department_name FROM departments WHERE status = 1`
    ) as [any[], any];
    if (departments.length > 0) {
      const deptValues = departments.map((d: any) => [taskId, d.department_id, d.department_name]);
      await db.query(
        'INSERT INTO evaluation_task_departments (task_id, department_id, department_name) VALUES ?',
        [deptValues]
      );
    }

    res.status(201).json({ id: taskId });
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

// 获取某任务的人员快照
export const getTaskPersons = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM evaluation_task_persons WHERE task_id = ? ORDER BY department_id, person_name',
      [taskId]
    ) as [any[], any];
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取某任务的部门快照
export const getTaskDepartments = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM evaluation_task_departments WHERE task_id = ? ORDER BY department_name',
      [taskId]
    ) as [any[], any];
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 