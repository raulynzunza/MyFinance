const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Account = sequelize.define('Account', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  balance_decimal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  color_code: { type: DataTypes.STRING },
}, {
  tableName: 'Accounts',
  timestamps: false,
  hooks: {
    beforeDestroy: async (account, options) => {
      // Manually delete related transactions to emulate CASCADE since alter:true is disabled
      const Transaction = require('./Transaction');
      await Transaction.destroy({ 
        where: { account_id: account.id },
        transaction: options.transaction // Pass along transaction if used
      });
    }
  }
});

module.exports = Account;
