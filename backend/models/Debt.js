const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Debt = sequelize.define('Debt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('Hutang', 'Piutang'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Belum Lunas', 'Lunas'),
    allowNull: false,
    defaultValue: 'Belum Lunas',
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'debts',
  timestamps: true,
});

module.exports = Debt;
