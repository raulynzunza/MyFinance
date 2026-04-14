const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Budget = sequelize.define('Budget', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  monthly_limit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  current_spent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 }
}, {
  tableName: 'Budgets',
  timestamps: false
});

module.exports = Budget;
