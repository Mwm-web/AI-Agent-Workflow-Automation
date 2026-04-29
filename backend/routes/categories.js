const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');

// Get all categories for user
router.get('/', auth, async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT id, name, color, created_at FROM categories WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );

    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      createdAt: cat.created_at
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create category
router.post('/', auth, async (req, res) => {
  try {
    const { name, color } = req.body;

    const [result] = await pool.query(
      'INSERT INTO categories (name, color, user_id) VALUES (?, ?, ?)',
      [name, color || '#3B82F6', req.user.userId]
    );

    const categoryId = result.insertId;

    const [categories] = await pool.query(
      'SELECT id, name, color, created_at FROM categories WHERE id = ?',
      [categoryId]
    );

    const category = categories[0];
    res.status(201).json({
      id: category.id,
      name: category.name,
      color: category.color,
      createdAt: category.created_at
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, color } = req.body;

    const [result] = await pool.query(
      'UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?',
      [name, color, req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const [categories] = await pool.query(
      'SELECT id, name, color, created_at FROM categories WHERE id = ?',
      [req.params.id]
    );

    const category = categories[0];
    res.json({
      id: category.id,
      name: category.name,
      color: category.color,
      createdAt: category.created_at
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
