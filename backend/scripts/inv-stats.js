require('dotenv').config();
const sql = require('mssql');
(async () => {
  for (const db of ['TMS_Database', 'TMSLatestNew']) {
    const p = await sql.connect({
      user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER, port: 1433, database: db,
      options: { trustServerCertificate: true, encrypt: false },
    });
    const r = await p.request().query(`
      SELECT SUM(CASE WHEN invoice='0' OR invoice IS NULL OR invoice='' THEN 1 ELSE 0 END) AS zeroInv,
             SUM(CASE WHEN invoice NOT IN ('0','') AND invoice IS NOT NULL THEN 1 ELSE 0 END) AS realInv,
             MAX(Doc) AS maxDoc
      FROM PSDetail WHERE Type='Sale'
    `);
    console.log(db, r.recordset[0]);
    await p.close();
  }
  process.exit(0);
})();
