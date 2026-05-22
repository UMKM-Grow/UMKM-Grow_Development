const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id_cabang',
    },
  },
  waktu_mulai: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  waktu_selesai: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  saldo_awal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  saldo_akhir: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Aktif', 'Selesai'),
    allowNull: false,
    defaultValue: 'Aktif',
  },
}, {
  tableName: 'shifts',
  timestamps: true,
});

module.exports = Shift;