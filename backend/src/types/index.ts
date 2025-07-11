// 人员相关类型
export interface Person {
  id: number;
  name: string;
  department_id: number;
}

// 代码相关类型
export interface Code {
  id: string;
  department_id: number;
  role: string;
  used: number;
}

// 权重相关类型
export interface Weight {
  id: number;
  department_id: number;
  role: string;
  weight: number;
  year: number;
}

export interface WeightRequest {
  department_id: number;
  role: string;
  weight: number;
  year: number;
}

// 管理员相关类型
export interface Admin {
  id: number;
  name: string;
  password: string;
  role: string;
}

export interface CodeLoginRequest {
  code: string;
}

export interface CodeLoginResponse {
  success: boolean;
  message: string;
  user?: {
    code: string;
    department_id: number;
  };
}

// 管理员相关类型
export interface AdminLoginRequest {
  name: string;
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
  max_score: number;
}

// 评分相关类型
export interface Score {
  id: number;
  code_id: string;
  person_id: number;
  indicator_id: number;
  score: number;
  year: number;
}

export interface ScoreRequest {
  code_id: string;
  person_id: number;
  indicator_id: number;
  score: number;
  year: number;
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
  department_id: string;
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
  id: number;
  name: string;
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