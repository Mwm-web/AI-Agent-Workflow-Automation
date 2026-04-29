const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');

// 获取当前运行的计时器
router.get('/active', auth, async (req, res) => {
  try {
    const [entries] = await pool.query(
      `SELECT te.*, t.title as task_title
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       WHERE te.user_id = ? AND te.end_time IS NULL`,
      [req.user.userId]
    );

    if (entries.length === 0) {
      return res.json(null);
    }

    const entry = entries[0];
    res.json({
      id: entry.id,
      taskId: entry.task_id,
      taskTitle: entry.task_title,
      startTime: entry.start_time
    });
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 开始计时
router.post('/start', auth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { taskId } = req.body;

    await connection.beginTransaction();

    await connection.query(
      'UPDATE time_entries SET end_time = NOW() WHERE user_id = ? AND end_time IS NULL',
      [req.user.userId]
    );

    const [result] = await connection.query(
      'INSERT INTO time_entries (task_id, user_id, start_time) VALUES (?, ?, NOW())',
      [taskId, req.user.userId]
    );

    await connection.commit();

    const [entries] = await pool.query(
      `SELECT te.*, t.title as task_title
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       WHERE te.id = ?`,
      [result.insertId]
    );

    const entry = entries[0];
    res.status(201).json({
      id: entry.id,
      taskId: entry.task_id,
      taskTitle: entry.task_title,
      startTime: entry.start_time
    });
  } catch (error) {
    await connection.rollback();
    console.error('Start timer error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// 停止计时
router.patch('/:id/stop', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE time_entries SET end_time = NOW() WHERE id = ? AND user_id = ? AND end_time IS NULL',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Active timer not found' });
    }

    const [entries] = await pool.query(
      `SELECT *, TIMESTAMPDIFF(MINUTE, start_time, end_time) as duration_minutes
       FROM time_entries WHERE id = ?`,
      [req.params.id]
    );

    const entry = entries[0];
    res.json({
      id: entry.id,
      taskId: entry.task_id,
      startTime: entry.start_time,
      endTime: entry.end_time,
      durationMinutes: entry.duration_minutes
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 获取时间记录列表
router.get('/', auth, async (req, res) => {
  try {
    const { taskId, startDate, endDate } = req.query;
    let query = `
      SELECT te.*, t.title as task_title,
             TIMESTAMPDIFF(MINUTE, te.start_time, COALESCE(te.end_time, NOW())) as duration_minutes
      FROM time_entries te
      JOIN tasks t ON te.task_id = t.id
      WHERE te.user_id = ?
    `;
    const params = [req.user.userId];

    if (taskId) {
      query += ' AND te.task_id = ?';
      params.push(taskId);
    }
    if (startDate) {
      query += ' AND te.start_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND te.start_time <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY te.start_time DESC';

    const [entries] = await pool.query(query, params);

    res.json(entries.map(e => ({
      id: e.id,
      taskId: e.task_id,
      taskTitle: e.task_title,
      startTime: e.start_time,
      endTime: e.end_time,
      durationMinutes: e.duration_minutes,
      description: e.description
    })));
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 获取时间统计
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { timezone = 'Asia/Shanghai' } = req.query;

    const [todayResult] = await pool.query(`
      SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) as total_minutes
      FROM time_entries
      WHERE user_id = ?
        AND end_time IS NOT NULL
        AND DATE(CONVERT_TZ(start_time, '+00:00', ?)) = DATE(CONVERT_TZ(NOW(), '+00:00', ?))
    `, [req.user.userId, timezone, timezone]);

    const [weekResult] = await pool.query(`
      SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) as total_minutes
      FROM time_entries
      WHERE user_id = ?
        AND end_time IS NOT NULL
        AND YEARWEEK(CONVERT_TZ(start_time, '+00:00', ?)) = YEARWEEK(CONVERT_TZ(NOW(), '+00:00', ?))
    `, [req.user.userId, timezone, timezone]);

    const [monthResult] = await pool.query(`
      SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) as total_minutes
      FROM time_entries
      WHERE user_id = ?
        AND end_time IS NOT NULL
        AND MONTH(CONVERT_TZ(start_time, '+00:00', ?)) = MONTH(CONVERT_TZ(NOW(), '+00:00', ?))
        AND YEAR(CONVERT_TZ(start_time, '+00:00', ?)) = YEAR(CONVERT_TZ(NOW(), '+00:00', ?))
    `, [req.user.userId, timezone, timezone, timezone, timezone]);

    res.json({
      today: Math.round(todayResult[0].total_minutes),
      thisWeek: Math.round(weekResult[0].total_minutes),
      thisMonth: Math.round(monthResult[0].total_minutes)
    });
  } catch (error) {
    console.error('Get time stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 手动添加时间记录
router.post('/', auth, async (req, res) => {
  try {
    const { taskId, startTime, endTime, description } = req.body;

    const [result] = await pool.query(
      'INSERT INTO time_entries (task_id, user_id, start_time, end_time, description) VALUES (?, ?, ?, ?, ?)',
      [taskId, req.user.userId, startTime, endTime, description]
    );

    res.status(201).json({ id: result.insertId, message: 'Time entry created' });
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 删除时间记录
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM time_entries WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    res.json({ message: 'Time entry deleted' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
