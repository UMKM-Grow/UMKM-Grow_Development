const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    sku: { type: DataTypes.STRING, allowNull: true, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    branch_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'products',
    timestamps: true,
  }
);

module.exports = Product;
