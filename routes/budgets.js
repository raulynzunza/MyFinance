const express = require('express');
const { Budget, Category, Transaction, Account } = require('../models');
const authenticateToken = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const userCategories = await Category.findAll({ where: { user_id: req.user.id } });
    const categoryIds = userCategories.map(c => c.id);

    // List all budgets in user's categories
    const budgets = await Budget.findAll({
      where: { category_id: categoryIds },
      include: [{ model: Category }]
    });

    // Calculate current spent dynamically
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const results = [];
    for (const budget of budgets) {
      // Find all transactions of this category in the current month
      const transactions = await Transaction.findAll({
        where: {
          category_id: budget.category_id,
          date: { [Op.between]: [firstDay, lastDay] }
        },
        include: [{ model: Account }]
      });

      // sum the absolute values of expenses
      const spent = transactions.reduce((acc, tx) => acc + Math.abs(parseFloat(tx.amount)), 0);

      results.push({
        id: budget.id,
        category: budget.Category,
        monthly_limit: parseFloat(budget.monthly_limit),
        current_spent: spent
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { category_id, monthly_limit } = req.body;
    
    const category = await Category.findOne({ where: { id: category_id, user_id: req.user.id } });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    // Ensure only 1 budget per category
    let budget = await Budget.findOne({ where: { category_id } });
    if (budget) {
      budget = await budget.update({ monthly_limit });
    } else {
      budget = await Budget.create({ category_id, monthly_limit, current_spent: 0 });
    }
    
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id, {
      include: [{ model: Category }]
    });

    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    if (budget.Category.user_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await budget.destroy();
    res.json({ message: 'Presupuesto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
