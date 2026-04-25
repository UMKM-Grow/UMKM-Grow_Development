const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: true },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING, allowNull: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    total_amount: { type: DataTypes.INTEGER, allowNull: true },
    payment_method: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    underscored: false,
  }
);

module.exports = Transaction;
