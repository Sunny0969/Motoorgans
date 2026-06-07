const cron = require('node-cron');
const { runDatabaseBackup } = require('./backupService');

let scheduledTask = null;

function startBackupScheduler() {
  if (scheduledTask) return;

  // Every day at 12:00 AM — filename uses previous day's date
  scheduledTask = cron.schedule('0 0 * * *', async () => {
    try {
      const result = await runDatabaseBackup({ usePreviousDate: true });
      console.log(`[Auto backup] Success: ${result.filePath} (${result.sizeMB} MB)`);
    } catch (err) {
      console.error('[Auto backup] Failed:', err.message);
    }
  });

  console.log('  ✓ Auto database backup scheduled daily at 12:00 AM');
}

module.exports = { startBackupScheduler };
