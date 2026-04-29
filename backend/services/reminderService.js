const { pool } = require('../config/db');
const emailService = require('./emailService');

class ReminderService {
  /**
   * 检查并发送即将到期的任务提醒
   */
  async checkAndSendReminders() {
    const connection = await pool.getConnection();
    try {
      const [tasks] = await connection.query(`
        SELECT t.*, u.email, u.username, u.id as user_id, rs.default_reminder_hours
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN reminder_settings rs ON u.id = rs.user_id
        WHERE t.status != 'completed'
          AND t.due_date IS NOT NULL
          AND t.due_date > NOW()
          AND t.due_date <= DATE_ADD(NOW(), INTERVAL COALESCE(rs.default_reminder_hours, 24) HOUR)
          AND (rs.email_enabled IS NULL OR rs.email_enabled = true)
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.task_id = t.id
              AND n.type = 'deadline_approaching'
              AND n.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
          )
      `);

      for (const task of tasks) {
        await connection.query(
          `INSERT INTO notifications (user_id, task_id, type, message, expires_at)
           VALUES (?, ?, 'deadline_approaching', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
          [task.user_id, task.id, `任务 "${task.title}" 将在 ${new Date(task.due_date).toLocaleString()} 到期`]
        );

        const { subject, body } = emailService.generateReminderEmail(task, task);
        await emailService.queueEmail(task.user_id, task.email, subject, body);
      }

      console.log(`Processed ${tasks.length} reminders`);
    } finally {
      connection.release();
    }
  }

  /**
   * 清理过期通知
   */
  async cleanupExpiredNotifications() {
    await pool.query(
      `DELETE FROM notifications WHERE expires_at < NOW()`
    );
  }
}

module.exports = new ReminderService();
