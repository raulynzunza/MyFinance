const express = require('express');
const { Account, Transaction } = require('../models');
const authenticateToken = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

// Obtener todas las cuentas del usuario
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.findAll({ where: { user_id: req.user.id } });
    
    // Patrimonio neto
    const totalBalance = accounts.reduce((acc, account) => acc + parseFloat(account.balance_decimal), 0);

    res.json({ accounts, totalBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear cuenta
router.post('/', async (req, res) => {
  try {
    const { name, balance_decimal, color_code } = req.body;
    const account = await Account.create({
      user_id: req.user.id,
      name,
      balance_decimal: balance_decimal || 0.00,
      color_code
    });
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar cuenta
router.put('/:id', async (req, res) => {
  try {
    const { name, balance_decimal, color_code } = req.body;
    const account = await Account.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    await account.update({ name, balance_decimal, color_code });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar cuenta
router.delete('/:id', async (req, res) => {
  try {
    const { transfer_to } = req.query; // ID of the account to move transactions to
    
    const account = await Account.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    if (transfer_to) {
      const targetAccount = await Account.findOne({ where: { id: transfer_to, user_id: req.user.id } });
      if (!targetAccount) return res.status(400).json({ error: 'La cuenta destino no existe' });

      // Move transactions to the new account
      await Transaction.update({ account_id: transfer_to }, { where: { account_id: account.id } });
    }

    // Now delete the account, any remaining transactions will be CASCADE deleted thanks to Sequelize association
    await account.destroy();

    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
