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
