import mysql from 'mysql2';
import dotenv from 'dotenv';
import { DatabaseConfig } from './types';

dotenv.config();

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lead_eval',
  port: parseInt(process.env.DB_PORT || '3306')
};

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool.promise(); 