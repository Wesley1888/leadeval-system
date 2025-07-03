const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 路由
app.use('/api', require('./routes/auth'));
app.use('/api/indicators', require('./routes/indicator'));
app.use('/api/users', require('./routes/user'));
app.use('/api/score', require('./routes/score'));

// 启动服务
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 