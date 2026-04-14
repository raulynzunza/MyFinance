const express = require('express');
const { Category } = require('../models');
const authenticateToken = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken);

// Get user categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { user_id: req.user.id }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías', details: error.message });
  }
});

// Create defaults if user has no categories
router.post('/defaults', async (req, res) => {
  try {
    const existing = await Category.count({ where: { user_id: req.user.id } });
    if (existing > 0) return res.status(400).json({ error: 'El usuario ya tiene categorías' });
    
    await Category.bulkCreate([
      { user_id: req.user.id, name: 'Sueldo', icon: '💰', type: 'Ingreso' },
      { user_id: req.user.id, name: 'Comida', icon: '🍔', type: 'Gasto' },
      { user_id: req.user.id, name: 'Transporte', icon: '🚗', type: 'Gasto' },
      { user_id: req.user.id, name: 'Servicios', icon: '⚡', type: 'Gasto' },
      { user_id: req.user.id, name: 'Ocio', icon: '🎉', type: 'Gasto' }
    ]);
    const categories = await Category.findAll({ where: { user_id: req.user.id } });
    res.status(201).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categorías', details: error.message });
  }
});

// Crear categoría
router.post('/', async (req, res) => {
  try {
    const { name, icon, type } = req.body;
    const category = await Category.create({
      user_id: req.user.id,
      name,
      icon,
      type // 'Ingreso' o 'Gasto'
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    await category.destroy();
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
