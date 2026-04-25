const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const TransactionDetail = require('./TransactionDetail');

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Transaction.hasMany(TransactionDetail, { foreignKey: 'transaction_id', as: 'details' });
TransactionDetail.belongsTo(Transaction, { foreignKey: 'transaction_id' });

Transaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Transaction, { foreignKey: 'customer_id', as: 'transactions' });

TransactionDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(TransactionDetail, { foreignKey: 'product_id', as: 'transaction_details' });

module.exports = {
  Product,
  ProductVariant,
  Customer,
  Transaction,
  TransactionDetail,
};
