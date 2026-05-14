const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define(
  'Expense',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    tanggal: { type: DataTypes.DATEONLY, allowNull: false },
    kategori: { type: DataTypes.STRING, allowNull: false },
    nominal: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    branch_id: { type: DataTypes.INTEGER, allowNull: true },
    keterangan: { type: DataTypes.TEXT, allowNull: true },
    bukti_foto: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'expenses',
    timestamps: true,
  }
);

module.exports = Expense;
