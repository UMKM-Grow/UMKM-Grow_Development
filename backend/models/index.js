const Product = require('./Product');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const TransactionDetail = require('./TransactionDetail');

Transaction.hasMany(TransactionDetail, { foreignKey: 'transaction_id', as: 'details' });
TransactionDetail.belongsTo(Transaction, { foreignKey: 'transaction_id' });

Transaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Transaction, { foreignKey: 'customer_id', as: 'transactions' });

TransactionDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(TransactionDetail, { foreignKey: 'product_id', as: 'transaction_details' });

module.exports = {
  Product,
  Customer,
  Transaction,
  TransactionDetail,
};
