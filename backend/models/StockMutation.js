const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StockMutation = sequelize.define(
    'StockMutation',
    {
      id_mutasi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      from_branch_id: { type: DataTypes.INTEGER, allowNull: false },
      to_branch_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      tanggal: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'stock_mutations',
      timestamps: true,
    },
  );

  StockMutation.associate = (models) => {
    StockMutation.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    StockMutation.belongsTo(models.Branch, { foreignKey: 'from_branch_id', as: 'fromBranch' });
    StockMutation.belongsTo(models.Branch, { foreignKey: 'to_branch_id', as: 'toBranch' });
  };

  return StockMutation;
};
