const express = require('express');
const { pool } = require('../models/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users — all users (for member search)
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY name');
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/users/me
router.get('/me', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id=$1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/users/me
router.put('/me', async (req, res, next) => {
  try {
    const { name } = req.body;
    const result = await pool.query('UPDATE users SET name=COALESCE($1,name) WHERE id=$2 RETURNING id,name,email,role', [name, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
