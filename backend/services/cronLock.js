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
