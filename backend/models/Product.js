const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nama: { type: DataTypes.STRING, allowNull: false },
      sku: { type: DataTypes.STRING, allowNull: true },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      branch_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'products',
      timestamps: true,
    },
  );

  Product.associate = (models) => {
    Product.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Product.hasMany(models.StockMutation, { foreignKey: 'product_id', as: 'mutations' });
  };

  return Product;
};
