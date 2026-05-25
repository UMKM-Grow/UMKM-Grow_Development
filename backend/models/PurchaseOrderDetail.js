const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrderDetail = sequelize.define('PurchaseOrderDetail', {
  id_detail_po: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  po_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  kuantitas_pesanan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  harga_beli: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: 'purchase_order_details',
  timestamps: true,
});

module.exports = PurchaseOrderDetail;
