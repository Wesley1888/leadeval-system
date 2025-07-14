import { Request, Response } from 'express';
import db from '../db';
import { EvaluationIndicator } from '../types';

export const getIndicators = async (req: Request, res: Response<EvaluationIndicator[]>): Promise<void> => {
  try {
    const [rows] = await db.query('SELECT * FROM evaluation_indicators') as [EvaluationIndicator[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' } as any);
  }
}; 