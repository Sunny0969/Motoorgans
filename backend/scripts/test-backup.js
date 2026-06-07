require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB, closeDB } = require('../config/mssqlconfig');

(async () => {
  const p = await connectDB();
  try {
    await p.request().query(`
      BACKUP DATABASE [TMSLatestNew]
      TO DISK = N'TMSLatestNew_test.bak'
      WITH FORMAT, INIT, NAME = N'test'
    `);
    console.log('BACKUP OK');
  } catch (e) {
    console.error('BACKUP ERR:', e.message);
    if (e.originalError) console.error('  original:', e.originalError.message);
  }

  try {
    const list = await p.request().query(`
      SELECT TOP 3 bmf.physical_device_name, bs.backup_start_date
      FROM msdb.dbo.backupmediafamily bmf
      INNER JOIN msdb.dbo.backupset bs ON bmf.media_set_id = bs.media_set_id
      ORDER BY bs.backup_start_date DESC
    `);
    console.log('Recent backups:', list.recordset);
  } catch (e) {
    console.error('msdb query:', e.message);
  }

  await closeDB();
})();
