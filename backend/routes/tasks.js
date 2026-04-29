const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');

// Helper function to build query with filters
const buildTaskQuery = (filters, userId) => {
  let query = `
    SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.is_pinned,
           t.category_id, t.created_at, t.updated_at,
           c.name as category_name, c.color as category_color,
           GROUP_CONCAT(tt.tag) as tags
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN task_tags tt ON t.id = tt.task_id
    WHERE t.user_id = ?
  `;
  const params = [userId];

  if (filters.status) {
    query += ' AND t.status = ?';
    params.push(filters.status);
  }

  if (filters.priority) {
    query += ' AND t.priority = ?';
    params.push(filters.priority);
  }

  if (filters.category) {
    query += ' AND t.category_id = ?';
    params.push(filters.category);
  }

  query += ' GROUP BY t.id ORDER BY t.created_at DESC';

  return { query, params };
};

// Get all tasks for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, category } = req.query;

    const { query, params } = buildTaskQuery(
      { status, priority, category },
      req.user.userId
    );

    const [tasks] = await pool.query(query, params);

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      isPinned: task.is_pinned === 1,
      category: task.category_id ? {
        _id: task.category_id,
        name: task.category_name,
        color: task.category_color
      } : null,
      tags: task.tags ? task.tags.split(',') : [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const [tasks] = await pool.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.is_pinned,
             t.category_id, t.created_at, t.updated_at,
             c.name as category_name, c.color as category_color,
             GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.id = ? AND t.user_id = ?
      GROUP BY t.id
    `, [req.params.id, req.user.userId]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = tasks[0];
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      isPinned: task.is_pinned === 1,
      category: task.category_id ? {
        _id: task.category_id,
        name: task.category_name,
        color: task.category_color
      } : null,
      tags: task.tags ? task.tags.split(',') : [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { title, description, status, priority, dueDate, category, tags } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO tasks (title, description, status, priority, due_date, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, status, priority, dueDate || null, category || null, req.user.userId]
    );

    const taskId = result.insertId;

    // Insert tags if provided
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tag => [taskId, tag]);
      await connection.query(
        'INSERT INTO task_tags (task_id, tag) VALUES ?',
        [tagValues]
      );
    }

    await connection.commit();

    // Fetch the created task with category
    const [tasks] = await pool.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.is_pinned, t.category_id, t.created_at, t.updated_at, c.name as category_name, c.color as category_color,
             GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [taskId]);

    const task = tasks[0];
    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      isPinned: task.is_pinned === 1,
      category: task.category_id ? {
        _id: task.category_id,
        name: task.category_name,
        color: task.category_color
      } : null,
      tags: task.tags ? task.tags.split(',') : [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { title, description, status, priority, dueDate, category, tags } = req.body;

    await connection.beginTransaction();

    // Check if task exists and belongs to user
    const [tasks] = await connection.query(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (tasks.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task
    await connection.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, category_id = ? WHERE id = ?',
      [title, description, status, priority, dueDate || null, category || null, req.params.id]
    );

    // Delete existing tags
    await connection.query(
      'DELETE FROM task_tags WHERE task_id = ?',
      [req.params.id]
    );

    // Insert new tags if provided
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tag => [req.params.id, tag]);
      await connection.query(
        'INSERT INTO task_tags (task_id, tag) VALUES ?',
        [tagValues]
      );
    }

    await connection.commit();

    // Fetch updated task
    const [updatedTasks] = await pool.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.is_pinned, t.category_id, t.created_at, t.updated_at, c.name as category_name, c.color as category_color,
             GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [req.params.id]);

    const task = updatedTasks[0];
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      isPinned: task.is_pinned === 1,
      category: task.category_id ? {
        _id: task.category_id,
        name: task.category_name,
        color: task.category_color
      } : null,
      tags: task.tags ? task.tags.split(',') : [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.query(
      'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?',
      [status, req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Fetch updated task
    const [tasks] = await pool.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, t.is_pinned, t.category_id, t.created_at, t.updated_at, c.name as category_name, c.color as category_color,
             GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [req.params.id]);

    const task = tasks[0];
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      isPinned: task.is_pinned === 1,
      category: task.category_id ? {
        _id: task.category_id,
        name: task.category_name,
        color: task.category_color
      } : null,
      tags: task.tags ? task.tags.split(',') : [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== 任务依赖相关路由 ==========

async function hasCircularDependency(taskId, dependsOnId, pool, visited = new Set()) {
  if (taskId === dependsOnId) return true;
  if (visited.has(dependsOnId)) return false;
  visited.add(dependsOnId);

  const [deps] = await pool.query(
    'SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?',
    [dependsOnId]
  );

  for (const dep of deps) {
    if (await hasCircularDependency(taskId, dep.depends_on_task_id, pool, visited)) {
      return true;
    }
  }
  return false;
}

router.post('/:id/dependencies', auth, async (req, res) => {
  try {
    const { dependsOnTaskId } = req.body;
    const taskId = req.params.id;

    if (await hasCircularDependency(taskId, dependsOnTaskId, pool)) {
      return res.status(400).json({ message: 'Circular dependency detected' });
    }

    await pool.query(
      'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)',
      [taskId, dependsOnTaskId]
    );

    res.status(201).json({ message: 'Dependency added' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Dependency already exists' });
    }
    console.error('Add dependency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/dependencies/:depId', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE td FROM task_dependencies td
       JOIN tasks t ON td.task_id = t.id
       WHERE td.id = ? AND t.user_id = ?`,
      [req.params.depId, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dependency not found' });
    }

    res.json({ message: 'Dependency removed' });
  } catch (error) {
    console.error('Remove dependency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/dependencies', auth, async (req, res) => {
  try {
    const [deps] = await pool.query(
      `SELECT td.id, td.depends_on_task_id, t.title, t.status
       FROM task_dependencies td
       JOIN tasks t ON td.depends_on_task_id = t.id
       WHERE td.task_id = ? AND t.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    res.json(deps.map(d => ({
      id: d.id,
      taskId: d.depends_on_task_id,
      title: d.title,
      status: d.status
    })));
  } catch (error) {
    console.error('Get dependencies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/dependents', auth, async (req, res) => {
  try {
    const [deps] = await pool.query(
      `SELECT td.id, td.task_id, t.title, t.status
       FROM task_dependencies td
       JOIN tasks t ON td.task_id = t.id
       WHERE td.depends_on_task_id = ? AND t.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    res.json(deps.map(d => ({
      id: d.id,
      taskId: d.task_id,
      title: d.title,
      status: d.status
    })));
  } catch (error) {
    console.error('Get dependents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pin/unpin task
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const { isPinned } = req.body;

    // Check if task exists and belongs to user
    const [tasks] = await pool.query(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update is_pinned field
    await pool.query(
      'UPDATE tasks SET is_pinned = ? WHERE id = ?',
      [isPinned ? 1 : 0, req.params.id]
    );

    res.json({ message: 'Task updated', isPinned: !!isPinned });
  } catch (error) {
    console.error('Pin task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
