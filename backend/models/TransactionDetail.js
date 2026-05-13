const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransactionDetail = sequelize.define(
  'TransactionDetail',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    transaction_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'transaction_details',
    timestamps: false,
    underscored: true,
  }
);

module.exports = TransactionDetail;
