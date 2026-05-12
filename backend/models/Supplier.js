const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_supplier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  kontak_person: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nomor_wa: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  alamat: {
    type: DataTypes.TEXT,
  },
  kategori_pasokan: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'suppliers',
  timestamps: true,
});

module.exports = Supplier;
