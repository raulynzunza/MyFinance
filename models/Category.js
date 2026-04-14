const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  icon: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM('Ingreso', 'Gasto'), allowNull: false },
}, {
  tableName: 'Categories',
  timestamps: false
});

module.exports = Category;
