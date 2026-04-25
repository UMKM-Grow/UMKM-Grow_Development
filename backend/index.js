require('dotenv').config();
const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
require('./models');

const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const posRoutes = require('./routes/posRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/pos', posRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

const port = Number(process.env.PORT) || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(port, () => {
      process.stdout.write(`Backend running on http://localhost:${port}\n`);
    });
  } catch (error) {
    process.stderr.write(`Failed to start backend: ${error?.message || error}\n`);
    process.exit(1);
  }
};

start();
