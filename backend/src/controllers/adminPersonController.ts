import { Request, Response } from 'express';
import db from '../db';
import { Person, PersonRequest, PaginatedResponse, SearchParams } from '../types';

// 获取人员列表（支持分页和搜索）
export const getPersons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      keyword, 
      department_id, 
      status,
      title
    } = req.query as SearchParams & { page?: string; limit?: string; title?: string };

    let query = `
      SELECT p.*, d.name as department_name 
      FROM persons p 
      LEFT JOIN departments d ON p.department_id = d.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (keyword) {
      query += ` AND (p.name LIKE ? OR p.current_position LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (department_id) {
      query += ` AND p.department_id = ?`;
      params.push(department_id);
    }

    if (status !== undefined) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (title) {
      query += ` AND p.title = ?`;
      params.push(title);
    }

    // 获取总数
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM (${query}) as temp`,
      params
    ) as [any[], any];

    const total = countRows[0].total;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // 获取分页数据
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), offset);

    const [rows] = await db.query(query, params) as [any[], any];

    const response: PaginatedResponse<Person> = {
      data: rows,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total_pages: Math.ceil(total / parseInt(limit as string))
    };

    res.json(response);
  } catch (err) {
    console.error('获取人员列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个人员详情
export const getPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT p.*, d.name as department_name 
      FROM persons p 
      LEFT JOIN departments d ON p.department_id = d.id 
      WHERE p.id = ?
    `, [id]) as [any[], any];

    if (rows.length === 0) {
      res.status(404).json({ message: '人员不存在' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('获取人员详情错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建人员
export const addPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const personData: PersonRequest = req.body;
    
    // 验证必填字段
    if (!personData.name || !personData.gender || !personData.current_position || !personData.department_id) {
      res.status(400).json({ message: '缺少必填字段' });
      return;
    }

    const [result] = await db.query(`
      INSERT INTO persons (name, gender, birth_date, education, title, political_status, 
                          current_position, appointment_date, division_of_labor, department_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      personData.name,
      personData.gender,
      personData.birth_date || null,
      personData.education || null,
      personData.title || null,
      personData.political_status || null,
      personData.current_position,
      personData.appointment_date || null,
      personData.division_of_labor || null,
      personData.department_id,
      personData.status || 1
    ]) as [any, any];

    res.status(201).json({ 
      message: '人员创建成功',
      id: result.insertId 
    });
  } catch (err) {
    console.error('创建人员错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新人员
export const updatePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const personData: Partial<PersonRequest> = req.body;

    const [result] = await db.query(`
      UPDATE persons 
      SET name = ?, gender = ?, birth_date = ?, education = ?, title = ?, 
          political_status = ?, current_position = ?, appointment_date = ?, 
          division_of_labor = ?, department_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      personData.name,
      personData.gender,
      personData.birth_date || null,
      personData.education || null,
      personData.title || null,
      personData.political_status || null,
      personData.current_position,
      personData.appointment_date || null,
      personData.division_of_labor || null,
      personData.department_id,
      personData.status,
      id
    ]) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '人员不存在' });
      return;
    }

    res.json({ message: '人员更新成功' });
  } catch (err) {
    console.error('更新人员错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除人员
export const deletePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查是否有关联的评分数据
    const [scoreRows] = await db.query(
      'SELECT COUNT(*) as count FROM scores WHERE person_id = ?',
      [id]
    ) as [any[], any];

    if (scoreRows[0].count > 0) {
      res.status(400).json({ message: '该人员有关联的评分数据，无法删除' });
      return;
    }

    const [result] = await db.query('DELETE FROM persons WHERE id = ?', [id]) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '人员不存在' });
      return;
    }

    res.json({ message: '人员删除成功' });
  } catch (err) {
    console.error('删除人员错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
}; 