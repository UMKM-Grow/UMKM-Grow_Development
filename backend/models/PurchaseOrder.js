const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id_po: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tanggal_pesanan: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Ordered', 'Received'),
    allowNull: false,
    defaultValue: 'Draft',
  },
  total_nilai: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null if user is not known or for seeds
  }
}, {
  tableName: 'purchase_orders',
  timestamps: true,
});

module.exports = PurchaseOrder;
