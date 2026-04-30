const express = require('express');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Helper: check project access
async function checkProjectAccess(projectId, userId) {
  const result = await pool.query(
    'SELECT pm.role, p.owner_id FROM project_members pm RIGHT JOIN projects p ON p.id=pm.project_id WHERE p.id=$1 AND (pm.user_id=$2 OR p.owner_id=$2)',
    [projectId, userId]
  );
  return result.rows[0] || null;
}

// GET /api/tasks?project_id=&assignee_id=&status=
router.get('/', async (req, res, next) => {
  try {
    const { project_id, assignee_id, status } = req.query;
    let query = `
      SELECT t.*, u.name as assignee_name, p.name as project_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users c ON c.id = t.created_by
      WHERE (
        t.project_id IN (
          SELECT project_id FROM project_members WHERE user_id = $1
          UNION SELECT id FROM projects WHERE owner_id = $1
        )
      )
    `;
    const params = [req.user.id];

    if (project_id) { params.push(project_id); query += ` AND t.project_id = $${params.length}`; }
    if (assignee_id) { params.push(assignee_id); query += ` AND t.assignee_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }

    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/tasks/dashboard — summary for current user
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [total, byStatus, overdue, myTasks] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM tasks t 
        WHERE t.project_id IN (SELECT project_id FROM project_members WHERE user_id=$1 UNION SELECT id FROM projects WHERE owner_id=$1)`, [userId]),
      pool.query(`SELECT status, COUNT(*) as count FROM tasks t
        WHERE t.project_id IN (SELECT project_id FROM project_members WHERE user_id=$1 UNION SELECT id FROM projects WHERE owner_id=$1)
        GROUP BY status`, [userId]),
      pool.query(`SELECT t.*, u.name as assignee_name, p.name as project_name FROM tasks t
        LEFT JOIN users u ON u.id=t.assignee_id LEFT JOIN projects p ON p.id=t.project_id
        WHERE t.due_date < NOW() AND t.status != 'done'
        AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id=$1 UNION SELECT id FROM projects WHERE owner_id=$1)
        ORDER BY t.due_date ASC LIMIT 5`, [userId]),
      pool.query(`SELECT t.*, p.name as project_name FROM tasks t
        LEFT JOIN projects p ON p.id=t.project_id
        WHERE t.assignee_id=$1 AND t.status != 'done'
        ORDER BY t.due_date ASC NULLS LAST LIMIT 5`, [userId])
    ]);

    res.json({
      total: parseInt(total.rows[0].count),
      byStatus: byStatus.rows,
      overdue: overdue.rows,
      myTasks: myTasks.rows
    });
  } catch (err) { next(err); }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const { title, description, status = 'todo', priority = 'medium', due_date, project_id, assignee_id } = req.body;
    if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id are required' });

    const access = await checkProjectAccess(project_id, req.user.id);
    if (!access) return res.status(403).json({ error: 'No access to this project' });

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, status, priority, due_date || null, project_id, assignee_id || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, assignee_id } = req.body;

    const task = await pool.query('SELECT * FROM tasks WHERE id=$1', [id]);
    if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

    const access = await checkProjectAccess(task.rows[0].project_id, req.user.id);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const result = await pool.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date),
        assignee_id = COALESCE($6, assignee_id),
        updated_at = NOW()
      WHERE id = $7 RETURNING *
    `, [title, description, status, priority, due_date, assignee_id, id]);

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await pool.query('SELECT * FROM tasks WHERE id=$1', [id]);
    if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

    const access = await checkProjectAccess(task.rows[0].project_id, req.user.id);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    // Only creator, project admin, or global admin can delete
    const mem = await pool.query('SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2', [task.rows[0].project_id, req.user.id]);
    const canDelete = task.rows[0].created_by === req.user.id || mem.rows[0]?.role === 'admin' || req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ error: 'Insufficient permissions' });

    await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
