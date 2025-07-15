import { Request, Response } from 'express';
import db from '../db';
import { Department, DepartmentRequest, PaginatedResponse, SearchParams } from '../types';

// 获取部门列表（支持分页和搜索）
export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      keyword, 
      type, 
      status 
    } = req.query as SearchParams & { page?: string; limit?: string; type?: string };

    let query = `
      SELECT d.*, p.name as parent_name
      FROM departments d 
      LEFT JOIN departments p ON d.parent_id = p.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (keyword) {
      query += ` AND (d.name LIKE ? OR d.code LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (type) {
      query += ` AND d.type = ?`;
      params.push(type);
    }

    if (status !== undefined) {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    // 获取总数
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM (${query}) as temp`,
      params
    ) as [any[], any];

    const total = countRows[0].total;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // 获取分页数据
    let sortBy = req.query.sort_by || '';
    let order = (req.query.order === 'desc' ? 'DESC' : 'ASC');
    if (sortBy === 'code') {
      query += ` ORDER BY d.code ${order} LIMIT ? OFFSET ?`;
    } else {
      query += ` ORDER BY d.level, d.name LIMIT ? OFFSET ?`;
    }
    params.push(parseInt(limit as string), offset);

    const [rows] = await db.query(query, params) as [any[], any];

    const response: PaginatedResponse<Department> = {
      data: rows,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total_pages: Math.ceil(total / parseInt(limit as string))
    };

    res.json(response);
  } catch (err) {
    console.error('获取部门列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取部门树形结构
export const getDepartmentTree = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, p.name as parent_name,
             (SELECT COUNT(*) FROM persons WHERE department_id = d.id AND status = 1) as person_count
      FROM departments d 
      LEFT JOIN departments p ON d.parent_id = p.id 
      WHERE d.status = 1
      ORDER BY d.code
    `) as [any[], any];

    // 构建树形结构
    const buildTree = (items: any[], parentId: number | null = null): any[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const tree = buildTree(rows);
    res.json(tree);
  } catch (err) {
    console.error('获取部门树形结构错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个部门详情
export const getDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT d.*, p.name as parent_name,
             (SELECT COUNT(*) FROM persons WHERE department_id = d.id AND status = 1) as person_count
      FROM departments d 
      LEFT JOIN departments p ON d.parent_id = p.id 
      WHERE d.id = ?
    `, [id]) as [any[], any];

    if (rows.length === 0) {
      res.status(404).json({ message: '部门不存在' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('获取部门详情错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建部门
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const departmentData: DepartmentRequest = req.body;
    
    // 验证必填字段
    if (!departmentData.name || !departmentData.type) {
      res.status(400).json({ message: '缺少必填字段' });
      return;
    }

    // 检查部门名称是否重复
    const [existingRows] = await db.query(
      'SELECT id FROM departments WHERE name = ?',
      [departmentData.name]
    ) as [any[], any];

    if (existingRows.length > 0) {
      res.status(400).json({ message: '部门名称已存在' });
      return;
    }

    const [result] = await db.query(`
      INSERT INTO departments (name, code, parent_id, level, type, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      departmentData.name,
      departmentData.code || null,
      departmentData.parent_id || null,
      departmentData.level || 1,
      departmentData.type,
      departmentData.status || 1
    ]) as [any, any];

    res.status(201).json({ 
      message: '部门创建成功',
      id: result.insertId 
    });
  } catch (err) {
    console.error('创建部门错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新部门
export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const departmentData: Partial<DepartmentRequest> = req.body;

    // 检查是否将部门设置为自己的子部门
    if (departmentData.parent_id && parseInt(departmentData.parent_id.toString()) === parseInt(id)) {
      res.status(400).json({ message: '不能将部门设置为自己的子部门' });
      return;
    }

    // 检查部门名称是否重复（排除自己）
    if (departmentData.name) {
      const [existingRows] = await db.query(
        'SELECT id FROM departments WHERE name = ? AND id != ?',
        [departmentData.name, id]
      ) as [any[], any];

      if (existingRows.length > 0) {
        res.status(400).json({ message: '部门名称已存在' });
        return;
      }
    }

    const [result] = await db.query(`
      UPDATE departments 
      SET name = ?, code = ?, parent_id = ?, level = ?, type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      departmentData.name,
      departmentData.code || null,
      departmentData.parent_id || null,
      departmentData.level,
      departmentData.type,
      departmentData.status,
      id
    ]) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '部门不存在' });
      return;
    }

    res.json({ message: '部门更新成功' });
  } catch (err) {
    console.error('更新部门错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除部门
export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查是否有子部门
    const [childRows] = await db.query(
      'SELECT COUNT(*) as count FROM departments WHERE parent_id = ?',
      [id]
    ) as [any[], any];

    if (childRows[0].count > 0) {
      res.status(400).json({ message: '该部门下有子部门，无法删除' });
      return;
    }

    // 检查是否有关联的人员
    const [personRows] = await db.query(
      'SELECT COUNT(*) as count FROM persons WHERE department_id = ?',
      [id]
    ) as [any[], any];

    if (personRows[0].count > 0) {
      res.status(400).json({ message: '该部门下有关联人员，无法删除' });
      return;
    }

    // 检查是否有关联的考核码
    const [codeRows] = await db.query(
      'SELECT COUNT(*) as count FROM evaluation_codes WHERE department_id = ?',
      [id]
    ) as [any[], any];

    if (codeRows[0].count > 0) {
      res.status(400).json({ message: '该部门下有关联考核码，无法删除' });
      return;
    }

    const [result] = await db.query('DELETE FROM departments WHERE id = ?', [id]) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '部门不存在' });
      return;
    }

    res.json({ message: '部门删除成功' });
  } catch (err) {
    console.error('删除部门错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取部门统计信息
export const getDepartmentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.type,
        COUNT(DISTINCT p.id) as person_count,
        COUNT(DISTINCT ec.id) as code_count,
        COUNT(DISTINCT s.id) as score_count,
        AVG(s.score) as avg_score
      FROM departments d
      LEFT JOIN persons p ON d.id = p.department_id AND p.status = 1
      LEFT JOIN evaluation_codes ec ON d.id = ec.department_id
      LEFT JOIN scores s ON d.id = (SELECT department_id FROM persons WHERE id = s.person_id)
      WHERE d.status = 1
      GROUP BY d.id, d.name, d.type
      ORDER BY d.level, d.name
    `) as [any[], any];

    res.json(rows);
  } catch (err) {
    console.error('获取部门统计信息错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 批量导入部门
export const importDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments: DepartmentRequest[] = req.body;

    if (!Array.isArray(departments) || departments.length === 0) {
      res.status(400).json({ message: '请提供有效的部门数据' });
      return;
    }

    const values = departments.map(dept => [
      dept.name,
      dept.code || null,
      dept.parent_id || null,
      dept.level || 1,
      dept.type,
      dept.status || 1
    ]);

    const [result] = await db.query(`
      INSERT INTO departments (name, code, parent_id, level, type, status)
      VALUES ?
    `, [values]) as [any, any];

    res.status(201).json({ 
      message: `成功导入 ${result.affectedRows} 条部门记录`,
      imported_count: result.affectedRows
    });
  } catch (err) {
    console.error('批量导入部门错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
}; 

export const getMaxDepartmentCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query('SELECT MAX(code) as maxCode FROM departments');
    res.json({ maxCode: rows[0].maxCode || '00000' });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
}; 