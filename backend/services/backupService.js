const fs = require('fs');
const path = require('path');
const os = require('os');
const sql = require('mssql');
const { connectDB } = require('../config/mssqlconfig');

/** Folder SQL Server can write to (not Program Files — Node cannot read that). */
function getSqlStagingBackupDir() {
  const dir = process.env.BACKUP_SQL_DIR
    || path.join(process.env.ProgramData || 'C:\\ProgramData', 'Motoorgans', 'Backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** User-facing folder (Downloads). */
function getDownloadsBackupDir() {
  const dir = process.env.BACKUP_DIR
    || path.join(os.homedir(), 'Downloads', 'MotoorgansBackups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function formatDateForFilename(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function resolveSqlBackupDirectory() {
  return getSqlStagingBackupDir();
}

async function verifyBackupInMsdb(pool, dbName, fileName) {
  const check = await pool.request()
    .input('dbName', sql.NVarChar, dbName)
    .input('filePart', sql.NVarChar, `%${fileName}%`)
    .query(`
      SELECT TOP 1
        bmf.physical_device_name AS filePath,
        bs.backup_start_date AS createdAt,
        CAST(bs.backup_size AS BIGINT) AS sizeBytes
      FROM msdb.dbo.backupset bs
      INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
      WHERE bs.database_name = @dbName
        AND bmf.physical_device_name LIKE @filePart
      ORDER BY bs.backup_start_date DESC
    `);
  return check.recordset[0] || null;
}

function copyToDownloads(sqlFilePath, fileName, downloadsDir) {
  const destPath = path.join(downloadsDir, fileName);
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`SQL backup file not readable: ${sqlFilePath}`);
  }
  fs.copyFileSync(sqlFilePath, destPath);
  const stat = fs.statSync(destPath);
  return { destPath, sizeBytes: stat.size };
}

async function runDatabaseBackup({ usePreviousDate = false } = {}) {
  const dbName = (process.env.DB_NAME || 'TMSLatestNew').replace(/[^\w]/g, '');
  const pool = await connectDB();

  const sqlBackupDir = await resolveSqlBackupDirectory();
  const downloadsDir = getDownloadsBackupDir();

  const fileDate = usePreviousDate
    ? (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; })()
    : new Date();

  const datePart = formatDateForFilename(fileDate);
  const fileName = usePreviousDate
    ? `${dbName}_${datePart}.bak`
    : `${dbName}_${datePart}_${String(fileDate.getHours()).padStart(2, '0')}${String(fileDate.getMinutes()).padStart(2, '0')}.bak`;

  const sqlBackupPath = path.join(sqlBackupDir, fileName);
  const diskPath = sqlBackupPath.replace(/'/g, "''");

  await pool.request().query(`
    BACKUP DATABASE [${dbName}]
    TO DISK = N'${diskPath}'
    WITH FORMAT, INIT, NAME = N'TMS Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10
  `);

  const verified = await verifyBackupInMsdb(pool, dbName, fileName);
  if (!verified) {
    throw new Error('Backup command ran but could not verify backup in SQL Server history.');
  }

  const sqlFilePath = verified.filePath;
  let finalPath = sqlFilePath;
  let sizeBytes = Number(verified.sizeBytes) || 0;

  let copiedToDownloads = false;
  try {
    const copied = copyToDownloads(sqlFilePath, fileName, downloadsDir);
    finalPath = copied.destPath;
    sizeBytes = copied.sizeBytes;
    copiedToDownloads = true;
  } catch (copyErr) {
    console.warn('[Backup] Could not copy to Downloads:', copyErr.message);
    if (fs.existsSync(sqlFilePath)) {
      finalPath = sqlFilePath;
      sizeBytes = fs.statSync(sqlFilePath).size;
    } else {
      throw new Error(`Backup failed: ${copyErr.message}`);
    }
  }

  return {
    success: true,
    database: dbName,
    filePath: finalPath,
    fileName,
    sizeBytes,
    sizeMB: Number((sizeBytes / 1024 / 1024).toFixed(2)),
    createdAt: verified.createdAt,
    scheduled: usePreviousDate,
    backupDirectory: copiedToDownloads ? downloadsDir : sqlBackupDir,
    sqlBackupPath: sqlFilePath,
    copiedToDownloads,
  };
}

async function listBackups() {
  const downloadsDir = getDownloadsBackupDir();
  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir)
      .filter((f) => f.toLowerCase().endsWith('.bak'))
      .map((f) => {
        const full = path.join(downloadsDir, f);
        const stat = fs.statSync(full);
        return {
          fileName: f,
          filePath: full,
          sizeMB: Number((stat.size / 1024 / 1024).toFixed(2)),
          modifiedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    return { directory: downloadsDir, files };
  }
  return { directory: downloadsDir, files: [] };
}

module.exports = {
  runDatabaseBackup,
  listBackups,
  getDownloadsBackupDir,
};
