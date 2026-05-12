const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: true },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'staff' },
    },
    {
      tableName: 'users',
      timestamps: true,
    },
  );

  User.associate = (models) => {
    User.hasMany(models.Branch, { foreignKey: 'manager_id', as: 'managedBranches' });
  };

  return User;
};
