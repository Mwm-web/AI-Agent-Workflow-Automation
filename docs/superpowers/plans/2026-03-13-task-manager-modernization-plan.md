# Task Manager 功能扩展与现代化实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Task Manager 添加任务提醒、依赖管理、时间追踪、快速添加功能，并全面升级 UI 现代化

**Architecture:** 后端使用 Express + MySQL 扩展新表和 API，前端 React 使用 CSS 变量主题系统 + Context 状态管理，采用渐进式增强方式逐个功能实现

**Tech Stack:** Node.js, Express, MySQL, React, CSS Variables, Framer Motion, Recharts, React Hotkeys

---

## 文件结构映射

### 后端新文件
```
backend/
├── migrations/
│   ├── 001_add_reminder_tables.sql
│   ├── 002_add_dependency_tables.sql
│   ├── 003_add_time_tracking_tables.sql
│   └── 004_add_email_queue.sql
├── services/
│   ├── emailService.js        # 邮件发送和队列
│   ├── cronLock.js            # 分布式锁
│   └── reminderService.js     # 提醒检查逻辑
├── routes/
│   ├── notifications.js       # 通知 API
│   ├── timeEntries.js         # 时间追踪 API
│   └── dependencies.js        # 依赖关系 API (合并到 tasks.js)
└── cron/
    └── reminderCron.js        # 定时任务
```

### 前端新文件
```
frontend/src/
├── context/
│   ├── ThemeContext.js        # 主题管理
│   ├── NotificationContext.js # 通知状态
│   └── TimerContext.js        # 计时器状态
├── components/
│   ├── NotificationCenter/    # 通知中心组件
│   ├── TaskCardV2/           # 新版任务卡片
│   ├── Sidebar/              # 侧边栏导航
│   ├── QuickAddModal/        # 快速添加弹窗
│   ├── TimeTracker/          # 计时器按钮
│   └── DependencyGraph/      # 依赖关系图
├── hooks/
│   ├── useTheme.js
│   ├── useTimer.js
│   ├── useNotifications.js
│   ├── useQuickAdd.js
│   └── useHotkeys.js
├── styles/
│   ├── variables.css         # CSS 变量
│   ├── animations.css        # 动画定义
│   └── dark-theme.css        # 暗色主题
└── pages/
    ├── DashboardV2.js        # 新版仪表盘
    └── Settings.js           # 设置页面
```

---

## Chunk 1: 基础架构与数据库

### Task 1.1: 安装后端依赖

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: 安装新依赖**

```bash
cd backend
npm install node-cron nodemailer
npm install --save-dev @types/node-cron
```

- [ ] **Step 2: 验证安装**

```bash
npm list node-cron nodemailer
```

Expected: 显示版本号

- [ ] **Step 3: Commit**

```bash
git add backend/package*.json
git commit -m "deps: add node-cron and nodemailer for reminders"
```

---

### Task 1.2: 创建数据库迁移脚本

**Files:**
- Create: `backend/migrations/001_add_reminder_tables.sql`

- [ ] **Step 1: 创建 reminders 相关表**

```sql
-- 提醒设置表
CREATE TABLE IF NOT EXISTS reminder_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  default_reminder_hours INT DEFAULT 24,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 通知记录表
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT,
  type ENUM('deadline_approaching', 'deadline_passed', 'dependency_unlocked'),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_task ON notifications(task_id);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);
```

- [ ] **Step 2: 创建依赖关系表**

Create: `backend/migrations/002_add_dependency_tables.sql`

```sql
-- 任务依赖表
CREATE TABLE IF NOT EXISTS task_dependencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  depends_on_task_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dependency (task_id, depends_on_task_id)
);

-- 索引
CREATE INDEX idx_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);
```

- [ ] **Step 3: 创建时间追踪表**

Create: `backend/migrations/003_add_time_tracking_tables.sql`

```sql
-- 时间记录表
CREATE TABLE IF NOT EXISTS time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_time ON time_entries(user_id, start_time);
CREATE INDEX idx_time_entries_active ON time_entries(user_id, end_time);

-- 任务表添加预估时间
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes INT NULL;

-- 用户表添加时区
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Shanghai';
```

- [ ] **Step 4: 创建邮件队列表和分布式锁表**

Create: `backend/migrations/004_add_email_queue.sql`

```sql
-- 定时任务分布式锁表
CREATE TABLE IF NOT EXISTS cron_locks (
  lock_name VARCHAR(50) PRIMARY KEY,
  locked_at TIMESTAMP,
  locked_by VARCHAR(100),
  expires_at TIMESTAMP NOT NULL
);

-- 邮件队列表
CREATE TABLE IF NOT EXISTS email_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  INDEX idx_status_created (status, created_at)
);
```

- [ ] **Step 5: 测试迁移脚本**

```bash
cd backend
# 进入 MySQL
mysql -u root -p
```

```sql
USE taskmanager;
SOURCE migrations/001_add_reminder_tables.sql;
SOURCE migrations/002_add_dependency_tables.sql;
SOURCE migrations/003_add_time_tracking_tables.sql;
SOURCE migrations/004_add_email_queue.sql;
SHOW TABLES;
```

Expected: 显示所有新表

- [ ] **Step 6: Commit**

```bash
git add backend/migrations/
git commit -m "db: add migration scripts for new features

- reminder_settings, notifications tables
- task_dependencies table
- time_entries table
- email_queue and cron_locks tables"
```

---

### Task 1.3: 更新数据库初始化脚本

**Files:**
- Modify: `backend/config/db.js`

- [ ] **Step 1: 在 initDB 中添加新表创建**

在 `initDB` 函数中，现有表创建之后，添加：

```javascript
// Create reminder_settings table
await connection.query(`
  CREATE TABLE IF NOT EXISTS reminder_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    default_reminder_hours INT DEFAULT 24,
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Create notifications table
await connection.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT,
    type ENUM('deadline_approaching', 'deadline_passed', 'dependency_unlocked'),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )
`);

// Create task_dependencies table
await connection.query(`
  CREATE TABLE IF NOT EXISTS task_dependencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    depends_on_task_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_dependency (task_id, depends_on_task_id)
  )
`);

// Create time_entries table
await connection.query(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
```

- [ ] **Step 2: Commit**

```bash
git add backend/config/db.js
git commit -m "db: update initDB to include new tables"
```

---

## Chunk 2: 后端服务层

### Task 2.1: 创建 Cron 分布式锁服务

**Files:**
- Create: `backend/services/cronLock.js`

- [ ] **Step 1: 创建文件**

```javascript
const { pool } = require('../config/db');

/**
 * 获取分布式锁
 * @param {string} lockName - 锁名称
 * @param {number} lockDurationSeconds - 锁持续时间（秒）
 * @returns {Promise<boolean>} 是否获取到锁
 */
async function acquireLock(lockName, lockDurationSeconds = 60) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `INSERT INTO cron_locks (lock_name, locked_at, locked_by, expires_at)
       VALUES (?, NOW(), ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
       ON DUPLICATE KEY UPDATE
       locked_at = IF(expires_at < NOW(), VALUES(locked_at), locked_at),
       locked_by = IF(expires_at < NOW(), VALUES(locked_by), locked_by),
       expires_at = IF(expires_at < NOW(), VALUES(expires_at), expires_at)`,
      [lockName, process.pid, lockDurationSeconds]
    );

    const [rows] = await connection.query(
      'SELECT locked_by FROM cron_locks WHERE lock_name = ?',
      [lockName]
    );
    return rows[0]?.locked_by === String(process.pid);
  } finally {
    connection.release();
  }
}

/**
 * 释放锁
 * @param {string} lockName - 锁名称
 */
async function releaseLock(lockName) {
  await pool.query(
    'UPDATE cron_locks SET expires_at = NOW() WHERE lock_name = ? AND locked_by = ?',
    [lockName, process.pid]
  );
}

module.exports = { acquireLock, releaseLock };
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/cronLock.js
git commit -m "feat: add cron distributed lock service"
```

---

### Task 2.2: 创建邮件服务

**Files:**
- Create: `backend/services/emailService.js`

- [ ] **Step 1: 创建邮件服务类**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/emailService.js
git commit -m "feat: add email service with queue and retry"
```

---

### Task 2.3: 创建提醒服务

**Files:**
- Create: `backend/services/reminderService.js`

- [ ] **Step 1: 创建提醒检查逻辑**

```javascript
const { pool } = require('../config/db');
const emailService = require('./emailService');

class ReminderService {
  /**
   * 检查并发送即将到期的任务提醒
   */
  async checkAndSendReminders() {
    const connection = await pool.getConnection();
    try {
      // 查找需要提醒的任务
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
        // 创建应用内通知
        await connection.query(
          `INSERT INTO notifications (user_id, task_id, type, message, expires_at)
           VALUES (?, ?, 'deadline_approaching', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
          [task.user_id, task.id, `任务 "${task.title}" 将在 ${new Date(task.due_date).toLocaleString()} 到期`]
        );

        // 发送邮件提醒
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/reminderService.js
git commit -m "feat: add reminder service for deadline checking"
```

---

## Chunk 6: 前端 Context 状态管理

### Task 6.1: 创建 ThemeContext

**Files:**
- Create: `frontend/src/context/ThemeContext.js`
- Modify: `frontend/public/index.html`

- [ ] **Step 1: 创建 ThemeContext**

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setIsDark(dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    };

    updateTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  const setThemeValue = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setThemeValue(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeValue, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

- [ ] **Step 2: 添加 FOUC 防护到 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Task Manager - Manage your tasks efficiently" />
    <title>Task Manager</title>
    <script>
      (function() {
        const theme = localStorage.getItem('theme') || 'system';
        const isDark = theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      })();
    </script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/ThemeContext.js frontend/public/index.html
git commit -m "feat: add theme context with FOUC prevention"
```

---

### Task 6.2: 创建 NotificationContext

**Files:**
- Create: `frontend/src/context/NotificationContext.js`

- [ ] **Step 1: 创建 NotificationContext**

```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}`, { isRead: true });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/context/NotificationContext.js
git commit -m "feat: add notification context"
```

---

### Task 6.3: 创建 TimerContext

**Files:**
- Create: `frontend/src/context/TimerContext.js`

- [ ] **Step 1: 创建 TimerContext**

```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchActiveTimer = useCallback(async () => {
    try {
      const response = await axios.get('/api/time-entries/active');
      if (response.data) {
        setActiveTimer(response.data);
        const startTime = new Date(response.data.startTime).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      } else {
        setActiveTimer(null);
        setElapsedSeconds(0);
      }
    } catch (error) {
      console.error('Failed to fetch active timer:', error);
    }
  }, []);

  const startTimer = async (taskId) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/time-entries/start', { taskId });
      setActiveTimer(response.data);
      setElapsedSeconds(0);
      return response.data;
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      setLoading(true);
      const response = await axios.patch(`/api/time-entries/${activeTimer.id}/stop`);
      setActiveTimer(null);
      setElapsedSeconds(0);
      return response.data;
    } catch (error) {
      console.error('Failed to stop timer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    if (activeTimer && elapsedSeconds > 0) {
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - ${activeTimer.taskTitle}`;
    } else {
      document.title = 'Task Manager';
    }
  }, [activeTimer, elapsedSeconds]);

  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider value={{
      activeTimer,
      elapsedSeconds,
      elapsedTimeFormatted: formatElapsedTime(),
      loading,
      startTimer,
      stopTimer,
      fetchActiveTimer
    }}>
      {children}
    </TimerContext.Provider>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/context/TimerContext.js
git commit -m "feat: add timer context"

---

## Chunk 7: 前端组件

### Task 7.1: 创建通知中心组件

**Files:**
- Create: `frontend/src/components/NotificationCenter/NotificationCenter.js`
- Create: `frontend/src/components/NotificationCenter/NotificationCenter.css`

- [ ] **Step 1: 创建组件**

```javascript
import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getIconByType = (type) => {
    switch (type) {
      case 'deadline_approaching': return '⏰';
      case 'deadline_passed': return '⚠️';
      case 'dependency_unlocked': return '🔓';
      default: return '📌';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="notification-center">
      <button className="notification-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>通知</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read">全部已读</button>
              )}
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <span>📭</span>
                  <p>暂无通知</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-type-icon">{getIconByType(notification.type)}</span>
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="notification-delete"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/NotificationCenter/
git commit -m "feat: add notification center component"
```

---

## 总结与下一步

实施计划已创建完成，涵盖了：

1. **Chunk 1**: 数据库迁移和基础架构
2. **Chunk 2**: 后端服务层（邮件、锁、提醒）
3. **Chunk 3**: 后端 API 路由（通知、时间追踪、依赖）
4. **Chunk 4**: 后端定时任务
5. **Chunk 5**: 前端基础架构（CSS 变量、动画）
6. **Chunk 6**: 前端 Context（主题、通知、计时器）
7. **Chunk 7**: 前端组件（通知中心）

剩余需要实现的内容：
- 快速添加组件和智能解析
- 依赖关系图组件
- 新版任务卡片
- 侧边栏导航
- 仪表盘页面
- 主题切换 UI
- 在 App.js 中集成所有 Context

**准备开始执行计划？** 使用 `superpowers:subagent-driven-development` 或 `superpowers:executing-plans` 来执行此计划。
```

---

## Chunk 3: 后端 API 路由

### Task 3.1: 创建通知 API 路由

**Files:**
- Create: `backend/routes/notifications.js`

- [ ] **Step 1: 创建路由文件**

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const auth = require('../middleware/auth');

// 获取用户通知列表
router.get('/', auth, async (req, res) => {
  try {
    const [notifications] = await pool.query(
      `SELECT n.*, t.title as task_title
       FROM notifications n
       LEFT JOIN tasks t ON n.task_id = t.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.userId]
    );

    res.json(notifications.map(n => ({
      id: n.id,
      taskId: n.task_id,
      taskTitle: n.task_title,
      type: n.type,
      message: n.message,
      isRead: n.is_read,
      createdAt: n.created_at
    })));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 获取未读通知数量
router.get('/unread-count', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
      [req.user.userId]
    );
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 标记通知已读
router.patch('/:id', auth, async (req, res) => {
  try {
    const { isRead } = req.body;
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?',
      [isRead, req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification updated' });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 标记所有通知已读
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [req.user.userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 删除通知
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

- [ ] **Step 2: 注册路由**

Modify: `backend/server.js`

在现有路由后添加：

```javascript
app.use('/api/notifications', require('./routes/notifications'));
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/notifications.js backend/server.js
git commit -m "feat: add notifications API routes"
```

---

### Task 3.2: 创建时间追踪 API 路由

**Files:**
- Create: `backend/routes/timeEntries.js`

- [ ] **Step 1: 创建路由文件**

```javascript
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

    // 停止其他运行中的计时器
    await connection.query(
      'UPDATE time_entries SET end_time = NOW() WHERE user_id = ? AND end_time IS NULL',
      [req.user.userId]
    );

    // 创建新计时器
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

    // 今日统计
    const [todayResult] = await pool.query(`
      SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) as total_minutes
      FROM time_entries
      WHERE user_id = ?
        AND end_time IS NOT NULL
        AND DATE(CONVERT_TZ(start_time, '+00:00', ?)) = DATE(CONVERT_TZ(NOW(), '+00:00', ?))
    `, [req.user.userId, timezone, timezone]);

    // 本周统计
    const [weekResult] = await pool.query(`
      SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 0) as total_minutes
      FROM time_entries
      WHERE user_id = ?
        AND end_time IS NOT NULL
        AND YEARWEEK(CONVERT_TZ(start_time, '+00:00', ?)) = YEARWEEK(CONVERT_TZ(NOW(), '+00:00', ?))
    `, [req.user.userId, timezone, timezone]);

    // 本月统计
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
```

- [ ] **Step 2: 注册路由**

Modify: `backend/server.js`

在现有路由后添加：

```javascript
app.use('/api/time-entries', require('./routes/timeEntries'));
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/timeEntries.js backend/server.js
git commit -m "feat: add time tracking API routes"
```

---

### Task 3.3: 扩展任务路由添加依赖功能

**Files:**
- Modify: `backend/routes/tasks.js`

- [ ] **Step 1: 在文件末尾添加依赖相关路由**

在 `module.exports = router;` 之前添加：

```javascript
// ========== 任务依赖相关路由 ==========

// 循环依赖检测辅助函数
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

// 添加依赖关系
router.post('/:id/dependencies', auth, async (req, res) => {
  try {
    const { dependsOnTaskId } = req.body;
    const taskId = req.params.id;

    // 检查循环依赖
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

// 移除依赖关系
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

// 获取任务的前置依赖
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

// 获取依赖此任务的任务
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/routes/tasks.js
git commit -m "feat: add task dependency routes"
```

---

## Chunk 4: 后端定时任务

### Task 4.1: 创建定时任务

**Files:**
- Create: `backend/cron/reminderCron.js`

- [ ] **Step 1: 创建定时任务文件**

```javascript
const cron = require('node-cron');
const reminderService = require('../services/reminderService');
const emailService = require('../services/emailService');
const { acquireLock } = require('../services/cronLock');

// 每分钟检查提醒
function startReminderCron() {
  cron.schedule('* * * * *', async () => {
    const hasLock = await acquireLock('reminder_check', 55);
    if (!hasLock) {
      console.log('Another instance is processing reminders, skipping...');
      return;
    }

    try {
      await reminderService.checkAndSendReminders();
    } catch (error) {
      console.error('Reminder cron error:', error);
    }
  });

  console.log('Reminder cron started');
}

// 每分钟处理邮件队列
function startEmailCron() {
  cron.schedule('* * * * *', async () => {
    const hasLock = await acquireLock('email_queue', 55);
    if (!hasLock) return;

    try {
      await emailService.processQueue();
    } catch (error) {
      console.error('Email cron error:', error);
    }
  });

  console.log('Email cron started');
}

// 每天凌晨清理过期通知
function startCleanupCron() {
  cron.schedule('0 0 * * *', async () => {
    const hasLock = await acquireLock('cleanup_notifications', 300);
    if (!hasLock) return;

    try {
      await reminderService.cleanupExpiredNotifications();
      console.log('Expired notifications cleaned up');
    } catch (error) {
      console.error('Cleanup cron error:', error);
    }
  });

  console.log('Cleanup cron started');
}

function startAllCrons() {
  startReminderCron();
  startEmailCron();
  startCleanupCron();
}

module.exports = { startAllCrons };
```

- [ ] **Step 2: 在 server.js 中启动定时任务**

Modify: `backend/server.js`

在文件顶部添加：

```javascript
const { startAllCrons } = require('./cron/reminderCron');
```

在 `app.listen` 后添加：

```javascript
// Start cron jobs
startAllCrons();
```

- [ ] **Step 3: Commit**

```bash
git add backend/cron/reminderCron.js backend/server.js
git commit -m "feat: add cron jobs for reminders and email queue"
```

---

## Chunk 5: 前端基础架构

### Task 5.1: 安装前端依赖

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd frontend
npm install react-hotkeys-hook date-fns framer-motion recharts
```

- [ ] **Step 2: 验证安装**

```bash
npm list react-hotkeys-hook date-fns framer-motion recharts
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package*.json
git commit -m "deps: add frontend dependencies for new features"
```

---

### Task 5.2: 创建 CSS 变量和主题系统

**Files:**
- Create: `frontend/src/styles/variables.css`
- Create: `frontend/src/styles/animations.css`
- Modify: `frontend/src/index.js`

- [ ] **Step 1: 创建 CSS 变量文件**

```css
/* Light Theme (default) */
:root {
  /* Primary Colors */
  --color-primary: #667eea;
  --color-primary-dark: #5a67d8;
  --color-gradient-start: #667eea;
  --color-gradient-end: #764ba2;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;

  /* Background Colors */
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --bg-hover: #e2e8f0;

  /* Text Colors */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --text-inverse: #ffffff;

  /* Border Colors */
  --border-color: #e2e8f0;
  --border-color-focus: #667eea;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;

  /* Z-index */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-tooltip: 400;
  --z-toast: 500;
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-hover: #475569;

  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;

  --border-color: #334155;
}
```

- [ ] **Step 2: 创建动画 CSS**

```css
/* Fade Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Slide Animations */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale Animations */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulse Animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Shake Animation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Spin Animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Utility Classes */
.animate-fade-in {
  animation: fadeIn var(--transition-base) forwards;
}

.animate-slide-in-top {
  animation: slideInFromTop var(--transition-base) forwards;
}

.animate-slide-in-bottom {
  animation: slideInFromBottom var(--transition-base) forwards;
}

.animate-scale-in {
  animation: scaleIn var(--transition-base) forwards;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Hover Transitions */
.hover-lift {
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Page Transitions */
.page-transition-enter {
  opacity: 0;
}

.page-transition-enter-active {
  opacity: 1;
  transition: opacity 200ms;
}

.page-transition-exit {
  opacity: 1;
}

.page-transition-exit-active {
  opacity: 0;
  transition: opacity 200ms;
}
```

- [ ] **Step 3: 更新 index.js 导入样式**

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/variables.css';
import './styles/animations.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles/ frontend/src/index.js
git commit -m "feat: add CSS variables and animations"
```

---

由于篇幅限制，计划文档将在下一个回复中继续。已完成的 Chunk 涵盖了基础架构和后端 API。接下来将是前端 Context、组件和页面的实现。