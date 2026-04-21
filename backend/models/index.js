const sequelize = require('../config/database');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const User = require('./User');
const Attendance = require('./Attendance');
const Customer = require('./Customer');

User.hasMany(Attendance, { foreignKey: 'user_id', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

let dbReady = false;

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

module.exports = { sequelize, Product, ProductVariant, User, Attendance, Customer, initDb, isDbReady };
