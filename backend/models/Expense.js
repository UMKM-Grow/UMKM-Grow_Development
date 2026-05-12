const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define(
    'Expense',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      description: { type: DataTypes.TEXT, allowNull: true },
      branch_id: { type: DataTypes.INTEGER, allowNull: true },
      date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'expenses',
      timestamps: true,
    },
  );

  Expense.associate = (models) => {
    Expense.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  };

  return Expense;
};
