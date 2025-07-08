import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from './routes/auth';
import indicatorRoutes from './routes/indicator';
import userRoutes from './routes/user';
import scoreRoutes from './routes/score';

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', authRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/score', scoreRoutes);

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// 404 处理 - using safer pattern without wildcard
// Generic 404 handler for unmatched routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    res.status(404).json({ message: 'Route not found' });
  }
});

// 开发环境下不需要处理SPA路由，前端由React开发服务器处理
// 生产环境下可以添加静态文件服务

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 