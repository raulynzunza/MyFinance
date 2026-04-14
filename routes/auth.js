const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'myfinances_super_secret_key';

// Registrar usuario
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      username,
      email,
      password_hash
    });

    // Create default categories for the new user
    const { Category } = require('../models');
    await Category.bulkCreate([
      { user_id: user.id, name: 'Sueldo', icon: '💰', type: 'Ingreso' },
      { user_id: user.id, name: 'Comida', icon: '🍔', type: 'Gasto' },
      { user_id: user.id, name: 'Transporte', icon: '🚗', type: 'Gasto' },
      { user_id: user.id, name: 'Servicios', icon: '⚡', type: 'Gasto' },
      { user_id: user.id, name: 'Ocio', icon: '🎉', type: 'Gasto' }
    ]);

    res.status(201).json({ message: 'Usuario registrado exitosamente', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Login exitoso', token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

module.exports = router;
