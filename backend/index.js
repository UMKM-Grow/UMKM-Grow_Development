const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./models');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const posRoutes = require('./routes/posRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { verifyToken } = require('./middlewares/authMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'public', 'uploads');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/customers', verifyToken, customerRoutes);
app.use('/api/pos', verifyToken, posRoutes);
app.use('/api/expenses', verifyToken, expenseRoutes);
app.use('/api/reports', verifyToken, reportRoutes);

app.get('/', (req, res) => {
  res.send('UMKM-Grow API is running...');
});

initDb().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
