const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    customer_id: { type: DataTypes.INTEGER, allowNull: true },
    total_amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    payment_method: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Transaction;
