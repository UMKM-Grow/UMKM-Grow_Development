const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Branch = sequelize.define(
    'Branch',
    {
      id_cabang: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nama_cabang: { type: DataTypes.STRING, allowNull: false },
      lokasi: { type: DataTypes.TEXT, allowNull: true },
      manager_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'branches',
      timestamps: true,
    },
  );

  Branch.associate = (models) => {
    Branch.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });
    Branch.hasMany(models.Product, { foreignKey: 'branch_id', as: 'products' });
    Branch.hasMany(models.Transaction, { foreignKey: 'branch_id', as: 'transactions' });
    Branch.hasMany(models.Expense, { foreignKey: 'branch_id', as: 'expenses' });
    Branch.hasMany(models.StockMutation, { foreignKey: 'from_branch_id', as: 'outgoingMutations' });
    Branch.hasMany(models.StockMutation, { foreignKey: 'to_branch_id', as: 'incomingMutations' });
  };

  return Branch;
};
