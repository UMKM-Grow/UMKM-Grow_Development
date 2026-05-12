const sequelize = require('../config/database');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const User = require('./User');
const Supplier = require('./Supplier');

const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');
    
    // Sync models (In production, use migrations)
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, Product, ProductVariant, User, Supplier, initDb };
