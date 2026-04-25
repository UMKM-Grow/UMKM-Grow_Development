const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'umkm_grow',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 2000,
    },
    pool: {
      acquire: Number(process.env.DB_ACQUIRE_TIMEOUT_MS) || 5000,
    },
  }
);

module.exports = sequelize;
