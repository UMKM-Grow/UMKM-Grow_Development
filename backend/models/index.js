const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, Sequelize.DataTypes);
const Branch = require('./Branch')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);
const Expense = require('./Expense')(sequelize, Sequelize.DataTypes);
const StockMutation = require('./StockMutation')(sequelize, Sequelize.DataTypes);

const models = {
  User,
  Branch,
  Product,
  Transaction,
  Expense,
  StockMutation,
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
