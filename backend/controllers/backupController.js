const { runDatabaseBackup, listBackups } = require('../services/backupService');

const createBackup = async (req, res) => {
  try {
    const usePreviousDate = req.body?.scheduled === true || req.query.scheduled === '1';
    const result = await runDatabaseBackup({ usePreviousDate });
    const locationHint = result.copiedToDownloads
      ? `Downloads folder:\n${result.filePath}`
      : `Backup folder (open this folder):\n${result.filePath}`;
    res.json({
      success: true,
      message: `Database backup completed successfully.\nFile: ${result.fileName}\nSize: ${result.sizeMB} MB\n${locationHint}`,
      ...result,
    });
  } catch (error) {
    console.error('POST /api/backup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Database backup failed.',
    });
  }
};

const getBackups = async (req, res) => {
  try {
    const data = await listBackups();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBackup, getBackups };
