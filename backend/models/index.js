const sequelize = require('../config/database');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const User = require('./User');
const Attendance = require('./Attendance');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const TransactionDetail = require('./TransactionDetail');
const Expense = require('./Expense');

User.hasMany(Attendance, { foreignKey: 'user_id', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Transaction.hasMany(TransactionDetail, { foreignKey: 'transaction_id', as: 'details' });
TransactionDetail.belongsTo(Transaction, { foreignKey: 'transaction_id' });

Transaction.belongsTo(Customer, {
  foreignKey: 'customer_id',
  as: 'customer',
  constraints: false,
  foreignKeyConstraints: false,
});
Customer.hasMany(Transaction, {
  foreignKey: 'customer_id',
  as: 'transactions',
  constraints: false,
});

TransactionDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(TransactionDetail, { foreignKey: 'product_id', as: 'transaction_details' });

User.hasMany(Expense, { foreignKey: 'user_id', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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

module.exports = {
  sequelize,
  Product,
  ProductVariant,
  User,
  Attendance,
  Customer,
  Transaction,
  TransactionDetail,
  Expense,
  initDb,
  isDbReady,
  ensureDbReady,
};
