import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from './routes/auth';
import personRoutes from './routes/person';
import indicatorRoutes from './routes/indicator';
import scoreRoutes from './routes/score';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api', authRoutes);
app.use('/api/person', personRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/admin', adminRoutes);

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// 404 处理 - 只处理 API 路由
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 