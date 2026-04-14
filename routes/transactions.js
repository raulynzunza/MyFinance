const express = require('express');
const { Transaction, Account, Category } = require('../models');
const authenticateToken = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticateToken);

// Obtener transacciones con filtros
router.get('/', async (req, res) => {
  try {
    const { account_id, date_start, date_end, type } = req.query;
    
    // First, verify which accounts belong to user to avoid querying other users' transactions
    const userAccounts = await Account.findAll({ where: { user_id: req.user.id } });
    const userAccountIds = userAccounts.map(a => a.id);

    const where = { account_id: userAccountIds };

    if (account_id) where.account_id = account_id;
    if (date_start && date_end) {
      where.date = { [Op.between]: [date_start, date_end] };
    }

    // Type filter requires joining with Category
    const include = [
      { model: Account, attributes: ['name', 'color_code'] },
      { model: Category, attributes: ['name', 'type', 'icon'] }
    ];

    let transactions = await Transaction.findAll({
      where,
      include,
      order: [['date', 'DESC'], ['id', 'DESC']]
    });

    if (type) {
      transactions = transactions.filter(t => t.Category && t.Category.type === type);
    }

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear transacción
router.post('/', async (req, res) => {
  try {
    const { account_id, category_id, amount, description, date, is_transfer, target_account_id } = req.body;

    const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id } });
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    // Handle Transfer
    if (is_transfer && target_account_id) {
      const targetAccount = await Account.findOne({ where: { id: target_account_id, user_id: req.user.id } });
      if (!targetAccount) return res.status(404).json({ error: 'Cuenta destino no encontrada' });

      // Restar de origen
      const currentBalance = parseFloat(account.balance_decimal);
      if (currentBalance - parseFloat(amount) < 0) {
         return res.status(400).json({ error: 'Saldo insuficiente para la transferencia' });
      }

      await account.update({ balance_decimal: currentBalance - parseFloat(amount) });
      await targetAccount.update({ balance_decimal: parseFloat(targetAccount.balance_decimal) + parseFloat(amount) });

      const txOut = await Transaction.create({
        account_id: account.id,
        amount: -parseFloat(amount), // Egreso
        description: `Transferencia a ${targetAccount.name}`,
        date,
        is_transfer: true
      });

      const txIn = await Transaction.create({
        account_id: targetAccount.id,
        amount: parseFloat(amount), // Ingreso
        description: `Transferencia desde ${account.name}`,
        date,
        is_transfer: true
      });

      return res.status(201).json({ txOut, txIn });
    }

    // Normal Transaction
    const finalCategoryId = (category_id && category_id !== '') ? parseInt(category_id, 10) : null;
    let finalAmount = parseFloat(amount);
    
    // Explicitly bypass checking category on Incomes if no category was selected
    if (finalCategoryId) {
      const category = await Category.findByPk(finalCategoryId);
      if (category && category.type === 'Gasto') {
        finalAmount = -Math.abs(finalAmount); // always save as negative for expense
      } else {
        finalAmount = Math.abs(finalAmount); // always positive for income
      }
    } else {
      // Si no hay categoría (es decir, es un ingreso puro), asegúrate de que sea positivo
      finalAmount = Math.abs(finalAmount);
    }

    const newBalance = parseFloat(account.balance_decimal) + finalAmount;
    if (newBalance < 0) {
        return res.status(400).json({ error: 'La transacción dejaría la cuenta en saldo negativo.' });
    }

    const transactionData = {
      account_id: parseInt(account_id, 10),
      amount: finalAmount,
      description,
      date
    };

    if (finalCategoryId) {
       transactionData.category_id = finalCategoryId;
    }

    const transaction = await Transaction.create(transactionData);

    await account.update({ balance_decimal: newBalance });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar transacción
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [{ model: Account }]
    });

    if (!transaction) return res.status(404).json({ error: 'Transacción no encontrada' });
    if (transaction.Account.user_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    const account = transaction.Account;
    // Revert balance
    const newBalance = parseFloat(account.balance_decimal) - parseFloat(transaction.amount);
    await account.update({ balance_decimal: newBalance });

    await transaction.destroy();
    res.json({ message: 'Transacción eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
