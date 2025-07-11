# LeadEval 考评系统

## 技术栈
- 前端：React + TypeScript + Ant Design + React Router
- 后端：Node.js + Express + TypeScript
- 数据库：MySQL

## 目录结构
- backend/ 后端服务
- frontend/ 前端应用
- docs/ 项目文档

## 快速启动

### 方法一：使用脚本（推荐）
1. 安装依赖：双击运行 `install-deps.bat`
2. 启动应用：双击运行 `start-app.bat`

### 方法二：手动启动
1. 安装依赖
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. 配置环境变量
   在 backend/.env 文件中填写数据库、JWT 密钥等信息（参考 .env.example）

3. 启动服务
   ```bash
   # 启动后端
   npm run dev --prefix backend
   
   # 启动前端（新终端）
   npm start --prefix frontend
   ```

## 新功能特性

### 路由系统
- 使用 React Router 实现单页应用路由
- 支持页面刷新后保持状态
- 自动重定向到合适的页面
- 路由保护机制

### 状态持久化
- 用户登录状态自动保存到本地存储
- 刷新页面后自动恢复登录状态
- 安全的登出机制

### 路由结构
- `/` - 根路径，自动重定向
- `/login` - 用户登录页面
- `/score` - 用户评分页面（需要登录）
- `/admin/login` - 管理员登录页面


## 常见问题
- 端口冲突：修改 .env 或 package.json 中的端口
- 依赖报错：删除 node_modules 并重新 npm install
- 路由问题：确保后端支持SPA路由（已配置） 