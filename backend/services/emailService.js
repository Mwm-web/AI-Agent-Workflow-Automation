const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * 将邮件加入队列
   */
  async queueEmail(userId, email, subject, body) {
    await pool.query(
      'INSERT INTO email_queue (user_id, email, subject, body) VALUES (?, ?, ?, ?)',
      [userId, email, subject, body]
    );
  }

  /**
   * 处理邮件队列
   */
  async processQueue() {
    const [emails] = await pool.query(
      `SELECT * FROM email_queue
       WHERE status = 'pending' AND retry_count < max_retries
       ORDER BY created_at ASC
       LIMIT 10`
    );

    for (const email of emails) {
      try {
        await this.send(email.email, email.subject, email.body);
        await pool.query(
          `UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?`,
          [email.id]
        );
      } catch (error) {
        console.error('Failed to send email:', error);
        await pool.query(
          `UPDATE email_queue SET retry_count = retry_count + 1,
           status = IF(retry_count + 1 >= max_retries, 'failed', 'pending')
           WHERE id = ?`,
          [email.id]
        );
      }
    }
  }

  /**
   * 发送邮件
   */
  async send(to, subject, html) {
    const info = await this.transporter.sendMail({
      from: `"Task Manager" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return info;
  }

  /**
   * 生成提醒邮件模板
   */
  generateReminderEmail(task, user) {
    const subject = `任务提醒: ${task.title}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">任务提醒</h2>
        <p>你好 ${user.username},</p>
        <p>您的任务即将到期：</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${task.title}</h3>
          <p><strong>截止日期:</strong> ${new Date(task.dueDate).toLocaleString()}</p>
          ${task.description ? `<p><strong>描述:</strong> ${task.description}</p>` : ''}
        </div>
        <p><a href="${process.env.FRONTEND_URL}/dashboard"
              style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          查看任务
        </a></p>
      </div>
    `;
    return { subject, body };
  }
}

module.exports = new EmailService();
