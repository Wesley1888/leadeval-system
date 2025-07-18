import { Request, Response } from 'express';
import db from '../db';
import { EvaluationCode, EvaluationCodeRequest, PaginatedResponse, SearchParams } from '../types';

// 获取考核码列表（支持分页和搜索）
export const getEvaluationCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      keyword, 
      department_id, 
      evaluator_type, 
      status,
      sort_by,
      order,
      task_id
    } = req.query as SearchParams & { page?: string; limit?: string; evaluator_type?: string; sort_by?: string; order?: string; task_id?: string };

    let query = `
      SELECT ec.*, d.name as department_name
      FROM evaluation_codes ec 
      LEFT JOIN departments d ON ec.department_id = d.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (keyword) {
      query += ` AND ec.code LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (department_id) {
      query += ` AND ec.department_id = ?`;
      params.push(department_id);
    }

    if (evaluator_type) {
      query += ` AND ec.evaluator_type = ?`;
      params.push(evaluator_type);
    }

    if (status !== undefined) {
      query += ` AND ec.status = ?`;
      params.push(status);
    }

    if (task_id) {
      query += ` AND ec.task_id = ?`;
      params.push(task_id);
    }

    // 获取总数
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM (${query}) as temp`,
      params
    ) as [any[], any];

    const total = countRows[0].total;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // 获取分页数据，支持自定义排序
    let orderBy = 'ec.created_at DESC';
    if (sort_by) {
      const allowed = ['id', 'department_id', 'created_at'];
      if (allowed.includes(sort_by)) {
        const ord = order === 'asc' ? 'ASC' : 'DESC';
        orderBy = `ec.${sort_by} ${ord}`;
      }
    }
    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), offset);

    const [rows] = await db.query(query, params) as [any[], any];

    const response: PaginatedResponse<EvaluationCode> = {
      data: rows,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total_pages: Math.ceil(total / parseInt(limit as string))
    };

    res.json(response);
  } catch (err) {
    console.error('获取考核码列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个考核码详情
export const getEvaluationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT ec.*, d.name as department_name
      FROM evaluation_codes ec 
      LEFT JOIN departments d ON ec.department_id = d.id 
      WHERE ec.id = ?
    `, [id]) as [any[], any];

    if (rows.length === 0) {
      res.status(404).json({ message: '考核码不存在' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('获取考核码详情错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建考核码
export const createEvaluationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const codeData: EvaluationCodeRequest = req.body;
    
    // 验证必填字段
    if (!codeData.code || !codeData.department_id || !codeData.evaluator_type || !codeData.task_id) {
      res.status(400).json({ message: '缺少必填字段' });
      return;
    }

    // 检查考核码是否重复
    const [existingRows] = await db.query(
      'SELECT id FROM evaluation_codes WHERE code = ?',
      [codeData.code]
    ) as [any[], any];

    if (existingRows.length > 0) {
      res.status(400).json({ message: '考核码已存在' });
      return;
    }

    // 验证部门是否存在
    const [deptRows] = await db.query(
      'SELECT id FROM departments WHERE id = ?',
      [codeData.department_id]
    ) as [any[], any];

    if (deptRows.length === 0) {
      res.status(400).json({ message: '部门不存在' });
      return;
    }

    // 验证任务是否存在
    const [taskRows] = await db.query(
      'SELECT id FROM evaluation_tasks WHERE id = ?',
      [codeData.task_id]
    ) as [any[], any];

    if (taskRows.length === 0) {
      res.status(400).json({ message: '考核任务不存在' });
      return;
    }

    const [result] = await db.query(`
      INSERT INTO evaluation_codes (code, department_id, evaluator_type, weight, status, task_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      codeData.code,
      codeData.department_id,
      codeData.evaluator_type,
      codeData.weight || 0,
      codeData.status || 1,
      codeData.task_id
    ]) as [any, any];

    res.status(201).json({ 
      message: '考核码创建成功',
      id: result.insertId 
    });
  } catch (err) {
    console.error('创建考核码错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新考核码
export const updateEvaluationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const codeData: Partial<EvaluationCodeRequest> = req.body;

    // 检查考核码是否重复（排除自己）
    if (codeData.code) {
      const [existingRows] = await db.query(
        'SELECT id FROM evaluation_codes WHERE code = ? AND id != ?',
        [codeData.code, id]
      ) as [any[], any];

      if (existingRows.length > 0) {
        res.status(400).json({ message: '考核码已存在' });
        return;
      }
    }

    const [result] = await db.query(`
      UPDATE evaluation_codes 
      SET code = ?, department_id = ?, evaluator_type = ?, weight = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      codeData.code,
      codeData.department_id,
      codeData.evaluator_type,
      codeData.weight,
      codeData.status,
      id
    ]) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '考核码不存在' });
      return;
    }

    res.json({ message: '考核码更新成功' });
  } catch (err) {
    console.error('更新考核码错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除考核码
export const deleteEvaluationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查是否有关联的评分数据
    const [scoreRows] = await db.query(
      'SELECT COUNT(*) as count FROM scores WHERE evaluator_code = (SELECT code FROM evaluation_codes WHERE id = ?)',
      [id]
    ) as [any[], any];

    if (scoreRows[0].count > 0) {
      res.status(400).json({ message: '该考核码有关联的评分数据，无法删除' });
      return;
    }

    const [result] = await db.query('DELETE FROM evaluation_codes WHERE id = ?', [id]) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ message: '考核码不存在' });
      return;
    }

    res.json({ message: '考核码删除成功' });
  } catch (err) {
    console.error('删除考核码错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取考核码统计信息
export const getEvaluationCodeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ec.evaluator_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN ec.status = 1 THEN 1 ELSE 0 END) as unused_count,
        SUM(CASE WHEN ec.status = 2 THEN 1 ELSE 0 END) as used_count,
        SUM(CASE WHEN ec.status = 0 THEN 1 ELSE 0 END) as disabled_count,
        AVG(ec.weight) as avg_weight
      FROM evaluation_codes ec
      GROUP BY ec.evaluator_type
      ORDER BY ec.evaluator_type
    `) as [any[], any];

    res.json(rows);
  } catch (err) {
    console.error('获取考核码统计信息错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 生成随机考核码
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 批量导入考核码
export const importEvaluationCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const codes: EvaluationCodeRequest[] = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      res.status(400).json({ message: '请提供有效的考核码数据' });
      return;
    }

    const values = codes.map(code => [
      code.code,
      code.department_id,
      code.evaluator_type,
      code.weight || 0,
      code.status || 1,
      code.task_id
    ]);

    const [result] = await db.query(`
      INSERT INTO evaluation_codes (code, department_id, evaluator_type, weight, status, task_id)
      VALUES ?
    `, [values]) as [any, any];

    res.status(201).json({ 
      message: `成功导入 ${result.affectedRows} 条考核码记录`,
      imported_count: result.affectedRows
    });
  } catch (err) {
    console.error('批量导入考核码错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
}; 

// 批量生成考核码
export const generateEvaluationCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      department_id, 
      evaluator_type, 
      weight, 
      count = 1, 
      task_id
    } = req.body;

    if (!department_id || !evaluator_type || count < 1 || count > 5000 || !task_id) {
      res.status(400).json({ message: '参数错误' });
      return;
    }

    // 验证部门是否存在
    const [deptRows] = await db.query(
      'SELECT id FROM departments WHERE id = ?',
      [department_id]
    ) as [any[], any];

    if (deptRows.length === 0) {
      res.status(400).json({ message: '部门不存在' });
      return;
    }

    // 验证任务是否存在
    const [taskRows] = await db.query(
      'SELECT id FROM evaluation_tasks WHERE id = ?',
      [task_id]
    ) as [any[], any];

    if (taskRows.length === 0) {
      res.status(400).json({ message: '考核任务不存在' });
      return;
    }

    const codes: string[] = [];
    const values: any[] = [];

    // 生成考核码
    for (let i = 0; i < count; i++) {
      const code = generateRandomCode();
      codes.push(code);
      values.push([code, department_id, evaluator_type, weight || 0, 1, task_id]);
    }

    const [result] = await db.query(`
      INSERT INTO evaluation_codes (code, department_id, evaluator_type, weight, status, task_id)
      VALUES ?
    `, [values]) as [any, any];

    res.status(201).json({ 
      message: `成功生成 ${result.affectedRows} 个考核码`,
      generated_count: result.affectedRows,
      codes: codes
    });
  } catch (err) {
    console.error('批量生成考核码错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
}; 

// 生成高层考核码
export const generateExecutiveCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    // 获取title为"公司领导"的人员列表
    const [leaderRows] = await db.query(`
      SELECT id, name, title 
      FROM persons 
      WHERE title = '公司领导' AND status = 1
      ORDER BY id
    `) as [any[], any];

    // 删除当年部门ID为1的考核码
    const currentYear = new Date().getFullYear();
    const [deleteResult] = await db.query(`
      DELETE FROM evaluation_codes 
      WHERE department_id = 1 
      AND YEAR(created_at) = ?
    `, [currentYear]) as [any, any];

    const codes: string[] = [];
    const values: any[] = [];

    // 为每个公司领导生成考核码
    for (const leader of leaderRows) {
      const code = generateRandomCode();
      codes.push(code);
      values.push([code, 1, leader.name, 1, 1]); // department_id=1, weight=1, status=1
    }

    if (values.length > 0) {
      const [result] = await db.query(`
        INSERT INTO evaluation_codes (code, department_id, evaluator_type, weight, status)
        VALUES ?
      `, [values]) as [any, any];

      res.status(201).json({ 
        message: `成功生成 ${result.affectedRows} 个高层考核码，删除了 ${deleteResult.affectedRows} 个旧考核码`,
        generated_count: result.affectedRows,
        deleted_count: deleteResult.affectedRows,
        codes: codes,
        leaders: leaderRows.map(l => ({ id: l.id, name: l.name }))
      });
    } else {
      res.json({ 
        message: '没有需要生成的考核码',
        generated_count: 0,
        deleted_count: deleteResult.affectedRows
      });
    }
  } catch (err) {
    console.error('生成高层考核码错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
}; 