const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/projects — list projects user belongs to
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        pm.role as my_role
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      WHERE p.owner_id = $1 OR pm.user_id = $1
      GROUP BY p.id, u.name, pm.role
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/projects
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1,$2,$3) RETURNING *',
      [name, description, req.user.id]
    );
    const project = result.rows[0];
    // Add creator as admin member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [project.id, req.user.id, 'admin']
    );
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const proj = await pool.query(`
      SELECT p.*, u.name as owner_name
      FROM projects p LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1
    `, [id]);
    if (!proj.rows.length) return res.status(404).json({ error: 'Project not found' });

    // Check membership
    const mem = await pool.query(
      'SELECT * FROM project_members WHERE project_id=$1 AND user_id=$2',
      [id, req.user.id]
    );
    if (!mem.rows.length && proj.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    // Members
    const members = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
    `, [id]);

    res.json({ ...proj.rows[0], members: members.rows });
  } catch (err) { next(err); }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [id]);
    if (!proj.rows.length) return res.status(404).json({ error: 'Not found' });

    const mem = await pool.query('SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2', [id, req.user.id]);
    const isOwner = proj.rows[0].owner_id === req.user.id;
    const isProjectAdmin = mem.rows[0]?.role === 'admin';
    if (!isOwner && !isProjectAdmin && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Insufficient permissions' });

    const result = await pool.query(
      'UPDATE projects SET name=COALESCE($1,name), description=COALESCE($2,description) WHERE id=$3 RETURNING *',
      [name, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const proj = await pool.query('SELECT * FROM projects WHERE id=$1', [id]);
    if (!proj.rows.length) return res.status(404).json({ error: 'Not found' });
    if (proj.rows[0].owner_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Only owner or admin can delete' });

    await pool.query('DELETE FROM projects WHERE id=$1', [id]);
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
});

// POST /api/projects/:id/members — add member
router.post('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const mem = await pool.query('SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2', [id, req.user.id]);
    const proj = await pool.query('SELECT owner_id FROM projects WHERE id=$1', [id]);
    if (!proj.rows.length) return res.status(404).json({ error: 'Project not found' });

    const isOwner = proj.rows[0].owner_id === req.user.id;
    if (!isOwner && mem.rows[0]?.role !== 'admin' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Insufficient permissions' });

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (project_id, user_id) DO UPDATE SET role=$3',
      [id, user_id, role]
    );
    res.json({ message: 'Member added' });
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const proj = await pool.query('SELECT owner_id FROM projects WHERE id=$1', [id]);
    if (!proj.rows.length) return res.status(404).json({ error: 'Not found' });

    const isOwner = proj.rows[0].owner_id === req.user.id;
    const mem = await pool.query('SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2', [id, req.user.id]);
    if (!isOwner && mem.rows[0]?.role !== 'admin' && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Insufficient permissions' });

    await pool.query('DELETE FROM project_members WHERE project_id=$1 AND user_id=$2', [id, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
});

module.exports = router;
