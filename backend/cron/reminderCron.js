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
