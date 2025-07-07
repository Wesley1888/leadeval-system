import { Request, Response } from 'express';
import db from '../db';
import { Indicator } from '../types';

export const getIndicators = async (req: Request, res: Response<Indicator[]>): Promise<void> => {
  try {
    const [rows] = await db.query('SELECT * FROM indicator') as [Indicator[], any];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' } as any);
  }
}; 