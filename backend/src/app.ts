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

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; 