// 用户相关类型
export interface User {
  id: number;
  name: string;
  password: string;
  role: 'user' | 'admin';
  department: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserLoginRequest {
  code: string;
}

export interface UserLoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    code: string;
    name: string;
    department: string;
    role: string;
  };
}

// 管理员相关类型
export interface AdminLoginRequest {
  code: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: number;
    name: string;
    role: string;
  };
}

// 指标相关类型
export interface Indicator {
  id: number;
  name: string;
  description: string;
  weight: number;
  category: string;
}

// 评分相关类型
export interface Score {
  id: number;
  user_id: number;
  target_user_id: number;
  indicator_id: number;
  score: number;
  comment?: string;
  created_at: Date;
}

export interface ScoreRequest {
  targetUserId: number;
  indicatorId: number;
  score: number;
  comment?: string;
}

export interface ScoreResponse {
  success: boolean;
  message: string;
  score?: Score;
}

// 统计相关类型
export interface ScoreStatistics {
  totalScores: number;
  averageScore: number;
  departmentStats: DepartmentStat[];
  indicatorStats: IndicatorStat[];
}

export interface DepartmentStat {
  department: string;
  averageScore: number;
  totalUsers: number;
}

export interface IndicatorStat {
  indicatorName: string;
  averageScore: number;
  totalScores: number;
}

// 数据库连接类型
export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

// JWT Token类型
export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// Express请求扩展
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// 环境变量类型
export interface EnvironmentVariables {
  DB_HOST: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_PORT: string;
  JWT_SECRET: string;
  PORT: string;
} 