import { Request, Response } from 'express';
import db from '../db';

interface ExecuteSqlRequest {
  sql: string;
}

interface ExecuteSqlResponse {
  success: boolean;
  message?: string;
  columns?: string[];
  data?: any[];
  affectedRows?: number;
}

export const executeSql = async (req: Request<{}, {}, ExecuteSqlRequest>, res: Response<ExecuteSqlResponse>): Promise<void> => {
  const { sql } = req.body;
  
  if (!sql || !sql.trim()) {
    res.status(400).json({ success: false, message: 'SQL 语句不能为空' });
    return;
  }

  // 安全检查：禁止危险操作
  const dangerousKeywords = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE',
    'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'PROCEDURE'
  ];
  
  const upperSql = sql.toUpperCase();
  const hasDangerousKeyword = dangerousKeywords.some(keyword => 
    upperSql.includes(keyword)
  );

  if (hasDangerousKeyword) {
    res.status(403).json({ 
      success: false, 
      message: '出于安全考虑，禁止执行包含 DROP、DELETE、TRUNCATE、ALTER、CREATE、INSERT、UPDATE 等关键字的 SQL 语句' 
    });
    return;
  }

  try {
    const [rows] = await db.query(sql) as [any[], any];
    
    // 如果是 SELECT 查询
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      if (Array.isArray(rows) && rows.length > 0) {
        const columns = Object.keys(rows[0]);
        res.json({
          success: true,
          message: `查询成功，返回 ${rows.length} 条记录`,
          columns,
          data: rows
        });
      } else {
        res.json({
          success: true,
          message: '查询成功，无数据返回',
          columns: [],
          data: []
        });
      }
    } else {
      // 非 SELECT 查询（如 SHOW、DESCRIBE 等）
      if (Array.isArray(rows)) {
        if (rows.length > 0 && typeof rows[0] === 'object') {
          const columns = Object.keys(rows[0]);
          res.json({
            success: true,
            message: `执行成功，返回 ${rows.length} 条记录`,
            columns,
            data: rows
          });
        } else {
          res.json({
            success: true,
            message: '执行成功',
            columns: [],
            data: rows
          });
        }
      } else {
        res.json({
          success: true,
          message: '执行成功',
          columns: [],
          data: []
        });
      }
    }
  } catch (error: any) {
    console.error('SQL 执行错误:', error);
    res.status(500).json({ 
      success: false, 
      message: `SQL 执行失败: ${error.message}` 
    });
  }
}; 