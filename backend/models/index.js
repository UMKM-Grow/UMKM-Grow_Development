const sequelize = require('../config/database');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const User = require('./User');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderDetail = require('./PurchaseOrderDetail');

// Define Relations
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

PurchaseOrder.hasMany(PurchaseOrderDetail, { foreignKey: 'po_id', as: 'details' });
PurchaseOrderDetail.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

Product.hasMany(PurchaseOrderDetail, { foreignKey: 'product_id', as: 'po_details' });
PurchaseOrderDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(PurchaseOrder, { foreignKey: 'user_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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

module.exports = { sequelize, Product, ProductVariant, User, Supplier, PurchaseOrder, PurchaseOrderDetail, initDb };
