import { Request, Response } from 'express';
import db from '../db';

export const getWeights = async (req: Request, res: Response): Promise<void> => {
  const { year = 2025 } = req.query;
  try {
    const [rows] = await db.query(`
      SELECT w.*, d.name as department_name 
      FROM weight w 
      LEFT JOIN departments d ON w.department_id = d.id 
      WHERE w.year = ?
      ORDER BY w.department_id, w.role
    `, [year]) as [any[], any];
    
    res.json({ success: true, data: rows });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const addWeight = async (req: Request, res: Response): Promise<void> => {
  const { department_id, role, weight, year = 2025 } = req.body;
  
  if (!department_id || !role || weight === undefined) {
    res.status(400).json({ success: false, message: '部门ID、角色和权重不能为空' });
    return void 0;
  }

  if (weight < 0 || weight > 10) {
    res.status(400).json({ success: false, message: '权重必须在0-10之间' });
    return void 0;
  }

  try {
    // 检查是否已存在相同的权重配置
    const [existing] = await db.query(
      'SELECT id FROM weight WHERE department_id = ? AND role = ? AND year = ?',
      [department_id, role, year]
    ) as [any[], any];

    if (existing.length > 0) {
      res.status(400).json({ success: false, message: '该部门和角色的权重配置已存在' });
      return void 0;
    }

    await db.query(
      'INSERT INTO weight (department_id, role, weight, year) VALUES (?, ?, ?, ?)',
      [department_id, role, weight, year]
    );

    res.json({ success: true, message: '权重添加成功' });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const updateWeight = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { weight } = req.body;

  if (weight === undefined || weight < 0 || weight > 10) {
    res.status(400).json({ success: false, message: '权重必须在0-10之间' });
    return void 0;
  }

  try {
    const [result] = await db.query(
      'UPDATE weight SET weight = ? WHERE id = ?',
      [weight, id]
    ) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: '权重配置不存在' });
      return void 0;
    }

    res.json({ success: true, message: '权重更新成功' });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const deleteWeight = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM weight WHERE id = ?',
      [id]
    ) as [any, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: '权重配置不存在' });
      return void 0;
    }

    res.json({ success: true, message: '权重删除成功' });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
};

export const getWeightByCode = async (req: Request, res: Response): Promise<void> => {
  const { code_id } = req.params;
  const { year = 2025 } = req.query;

  try {
    const [rows] = await db.query(`
      SELECT w.weight 
      FROM weight w 
      JOIN code c ON w.department_id = c.department_id AND w.role = c.role 
      WHERE c.id = ? AND w.year = ?
    `, [code_id, year]) as [any[], any];

    if (rows.length === 0) {
      res.json({ success: true, weight: 1.0 }); // 默认权重
      return void 0;
    }

    res.json({ success: true, weight: rows[0].weight });
    return void 0;
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
    return void 0;
  }
}; 