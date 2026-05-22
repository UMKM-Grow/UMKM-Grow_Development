const { DataTypes } = require('sequelize');
const sequel = require('../config/database');

const StoreSetting = sequel.define('StoreSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  nama_toko: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nomor_telepon: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  service_charge_percent: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  tax_percent: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'store_settings',
  timestamps: true
});

module.exports = StoreSetting;