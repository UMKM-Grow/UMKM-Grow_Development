const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define(
  'ProductVariant',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    variant_name: { type: DataTypes.STRING, allowNull: true },
    sku_variant: { type: DataTypes.STRING, allowNull: true },
    additional_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'product_variants',
    timestamps: true,
  }
);

module.exports = ProductVariant;
