const sequelize = require('../config/database');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const User = require('./User');
const Attendance = require('./Attendance');
const Customer = require('./Customer');
const Transaction = require('./Transaction');

User.hasMany(Attendance, { foreignKey: 'user_id', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

let dbReady = false;
let initPromise = null;

const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');
    
    // Sync models (In production, use migrations)
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
    dbReady = true;
    return true;
  } catch (error) {
    dbReady = false;
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

const isDbReady = () => dbReady;

const ensureDbReady = async () => {
  if (dbReady) return true;
  if (initPromise) return initPromise;
  initPromise = initDb().finally(() => {
    initPromise = null;
  });
  return initPromise;
};

module.exports = { sequelize, Product, ProductVariant, User, Attendance, Customer, Transaction, initDb, isDbReady, ensureDbReady };
