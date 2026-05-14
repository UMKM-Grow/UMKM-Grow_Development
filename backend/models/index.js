const sequelize = require('../config/database');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const User = require('./User');
const Attendance = require('./Attendance');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const TransactionDetail = require('./TransactionDetail');
const Expense = require('./Expense');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderDetail = require('./PurchaseOrderDetail');
const Branch = require('./Branch')(sequelize);
const Promo = require('./Promo');
const StockMutation = require('./StockMutation')(sequelize);

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

// Supplier and Purchase Order Relations
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

PurchaseOrder.hasMany(PurchaseOrderDetail, { foreignKey: 'po_id', as: 'details' });
PurchaseOrderDetail.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

Product.hasMany(PurchaseOrderDetail, { foreignKey: 'product_id', as: 'po_details' });
PurchaseOrderDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(PurchaseOrder, { foreignKey: 'user_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Branch.hasMany(Product, { foreignKey: 'branch_id', as: 'products' });
Product.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Branch.hasMany(Transaction, { foreignKey: 'branch_id', as: 'transactions' });
Transaction.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Branch.hasMany(Promo, { foreignKey: 'branch_id', as: 'promos' });
Promo.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Branch.hasMany(Expense, { foreignKey: 'branch_id', as: 'expenses' });
Expense.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Product.hasMany(StockMutation, { foreignKey: 'product_id', as: 'stock_mutations' });
StockMutation.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Branch.hasMany(StockMutation, { foreignKey: 'from_branch_id', as: 'outgoingMutations' });
Branch.hasMany(StockMutation, { foreignKey: 'to_branch_id', as: 'incomingMutations' });
StockMutation.belongsTo(Branch, { foreignKey: 'from_branch_id', as: 'fromBranch' });
StockMutation.belongsTo(Branch, { foreignKey: 'to_branch_id', as: 'toBranch' });

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
  Supplier,
  PurchaseOrder,
  PurchaseOrderDetail,
  Branch,
  Promo,
  StockMutation,
  initDb,
  isDbReady,
  ensureDbReady,
};
