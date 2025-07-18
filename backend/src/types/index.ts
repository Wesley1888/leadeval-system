// 部门相关类型
export interface Department {
  id: number;
  name: string;
  code?: string;
  parent_id?: number;
  level: number;
  type: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentRequest {
  name: string;
  code?: string;
  parent_id?: number;
  level: number;
  type: string;
  status?: number;
}

// 人员相关类型
export interface Person {
  id: number;
  name: string;
  gender: string;
  birth_date?: string;
  education?: string;
  title?: string;
  political_status?: string;
  current_position: string;
  appointment_date?: string;
  division_of_labor?: string;
  department_id: number;
  department_name?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface PersonRequest {
  name: string;
  gender: string;
  birth_date?: string;
  education?: string;
  title?: string;
  political_status?: string;
  current_position: string;
  appointment_date?: string;
  division_of_labor?: string;
  department_id: number;
  status?: number;
}

// 考核码相关类型
export interface EvaluationCode {
  id: number;
  code: string;
  department_id: number;
  evaluator_type: string;
  weight: number;
  status: number;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCodeRequest {
  code: string;
  department_id: number;
  evaluator_type: string;
  weight: number;
  status?: number;
  task_id: number;
}

// 考核任务相关类型
export interface EvaluationTask {
  id: number;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  status: number;
  description?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface EvaluationTaskRequest {
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  status?: number;
  description?: string;
  created_by: number;
}

// 考核指标相关类型
export interface EvaluationIndicator {
  id: number;
  name: string;
  category: string;
  weight: number;
  description?: string;
  status: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EvaluationIndicatorRequest {
  name: string;
  category: string;
  weight: number;
  description?: string;
  status?: number;
  sort_order?: number;
}

// 评分相关类型
export interface Score {
  id: number;
  task_id: number;
  evaluator_code: string;
  person_id: number;
  indicator_id: number;
  score: number;
  level: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreRequest {
  task_id: number;
  evaluator_code: string;
  person_id: number;
  indicator_id: number;
  score: number;
  level: string;
  comment?: string;
}

export interface ScoreResponse {
  success: boolean;
  message: string;
  score?: Score;
}

// 管理员相关类型
export interface Admin {
  id: number;
  username: string;
  password: string;
  name: string;
  role: string;
  status: number;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminRequest {
  username: string;
  password: string;
  name: string;
  role: string;
  status?: number;
}

// 登录相关类型
export interface CodeLoginRequest {
  code: string;
}

export interface CodeLoginResponse {
  success: boolean;
  message: string;
  user?: {
    code: string;
    department_id: number;
    evaluator_type: string;
    weight: number;
  };
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

// 统计相关类型
export interface ScoreStatistics {
  totalScores: number;
  averageScore: number;
  departmentStats: DepartmentStat[];
  indicatorStats: IndicatorStat[];
  taskStats: TaskStat[];
}

export interface DepartmentStat {
  department_id: number;
  department_name: string;
  averageScore: number;
  totalUsers: number;
  totalScores: number;
}

export interface IndicatorStat {
  indicator_id: number;
  indicator_name: string;
  category: string;
  averageScore: number;
  totalScores: number;
  weight: number;
}

export interface TaskStat {
  task_id: number;
  task_name: string;
  year: number;
  totalScores: number;
  averageScore: number;
  status: number;
}

// 考核结果相关类型
export interface EvaluationResult {
  person_id: number;
  person_name: string;
  department_id: number;
  department_name: string;
  task_id: number;
  task_name: string;
  year: number;
  average_score: number;
  evaluation_count: number;
  final_level: string;
  category_scores: CategoryScore[];
}

export interface CategoryScore {
  category: string;
  average_score: number;
  weight: number;
  weighted_score: number;
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
  username: string;
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

// 系统日志相关类型
export interface SystemLog {
  id: number;
  user_type: string;
  user_id: string;
  action: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SystemLogRequest {
  user_type: string;
  user_id: string;
  action: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
}

// 分页相关类型
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 搜索相关类型
export interface SearchParams {
  keyword?: string;
  department_id?: number;
  status?: number;
  year?: number;
  evaluator_type?: string;
  category?: string;
}

// 导出相关类型
export interface ExportRequest {
  task_id?: number;
  department_id?: number;
  year?: number;
  format: 'excel' | 'pdf' | 'csv';
}

export interface ExportResponse {
  success: boolean;
  message: string;
  download_url?: string;
  filename?: string;
} 