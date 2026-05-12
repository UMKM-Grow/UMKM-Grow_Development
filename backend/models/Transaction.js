const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      branch_id: { type: DataTypes.INTEGER, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },
    },
    {
      tableName: 'transactions',
      timestamps: true,
    },
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  };

  return Transaction;
};
