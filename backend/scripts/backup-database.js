require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { connectDB, closeDB } = require('../config/mssqlconfig');

const backupPath = process.argv[2] || 'C:\\TMSLatestNew_backup.bak';

(async () => {
  const dir = path.dirname(backupPath);
  if (!fs.existsSync(dir)) {
    console.error(`Directory does not exist: ${dir}`);
    process.exit(1);
  }

  const pool = await connectDB();
  console.log(`Backing up TMSLatestNew to:\n  ${backupPath}\n`);

  await pool.request().query(`
    BACKUP DATABASE TMSLatestNew
    TO DISK = N'${backupPath.replace(/'/g, "''")}'
    WITH FORMAT, INIT, NAME = N'TMS Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10
  `);

  const stat = fs.statSync(backupPath);
  console.log(`\nBackup completed successfully.`);
  console.log(`Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  await closeDB();
})().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});
