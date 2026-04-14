const sequelize = require('../db');
const User = require('./User');
const Account = require('./Account');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Budget = require('./Budget');

User.hasMany(Account, { foreignKey: 'user_id' });
Account.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Category, { foreignKey: 'user_id' });
Category.belongsTo(User, { foreignKey: 'user_id' });

Account.hasMany(Transaction, { foreignKey: 'account_id', onDelete: 'CASCADE' });
Transaction.belongsTo(Account, { foreignKey: 'account_id' });

Category.hasMany(Transaction, { foreignKey: 'category_id' });
Transaction.belongsTo(Category, { foreignKey: 'category_id' });

Category.hasOne(Budget, { foreignKey: 'category_id', onDelete: 'CASCADE' });
Budget.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = {
  sequelize,
  User,
  Account,
  Category,
  Transaction,
  Budget
};
