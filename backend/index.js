const express = require('express');
const cors = require('cors');
const models = require('./models');
const branchRoutes = require('./routes/branchRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/branches', branchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;

models.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to sync database:', error);
  });
