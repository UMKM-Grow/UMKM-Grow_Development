const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Member = sequelize.define(
  'Member',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nama: { type: DataTypes.STRING, allowNull: false },
    nomor_telepon: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: true },
    total_poin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    level: {
      type: DataTypes.ENUM('Bronze', 'Silver', 'Gold'),
      allowNull: false,
      defaultValue: 'Bronze',
    },
  },
  {
    tableName: 'members',
    timestamps: true,
  }
);

module.exports = Member;
