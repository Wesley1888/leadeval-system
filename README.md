# LeadEval 考评系统

## 技术栈
- 前端：React + TypeScript + Ant Design
- 后端：Node.js + Express + TypeScript
- 数据库：MySQL

## 目录结构
- backend/ 后端服务
- frontend/ 前端应用
- docs/ 项目文档

## 快速启动

### 1. 克隆项目
git clone https://gitee.com/shorey/leadeval-system.git

### 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

### 3. 配置环境变量
在 backend/.env 文件中填写数据库、JWT 密钥等信息（参考 .env.example）

### 4. 启动
npm run dev --prefix backend
npm start --prefix frontend

## 常见问题
- 端口冲突：修改 .env 或 package.json 中的端口
- 依赖报错：删除 node_modules 并重新 npm install 