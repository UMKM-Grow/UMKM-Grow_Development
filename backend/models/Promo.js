const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Promo = sequelize.define(
  'Promo',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    kode_promo: { type: DataTypes.STRING, allowNull: false, unique: true },
    tipe_diskon: { type: DataTypes.ENUM('Persentase', 'Nominal'), allowNull: false },
    nilai_diskon: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    minimal_belanja: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    tanggal_mulai: { type: DataTypes.DATE, allowNull: false },
    tanggal_berakhir: { type: DataTypes.DATE, allowNull: false },
    branch_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'promos',
    timestamps: true,
  }
);

module.exports = Promo;
