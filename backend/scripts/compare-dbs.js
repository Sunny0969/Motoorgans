require('dotenv').config();
const sql = require('mssql');

const configs = [
  { name: 'TMS_Database', database: 'TMS_Database' },
  { name: 'TMSLatestNew', database: 'TMSLatestNew' },
];

const base = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Rathi@0969',
  server: process.env.DB_SERVER || 'localhost',
  port: Number(process.env.DB_PORT || 1433),
  options: { trustServerCertificate: true, encrypt: false },
};

(async () => {
  for (const cfg of configs) {
    try {
      const pool = await sql.connect({ ...base, database: cfg.database });
      const r = await pool.request().query(`
        SELECT TOP 3 Doc, invoice, Date, Amount FROM PSDetail WHERE Type='Sale' ORDER BY Doc DESC
      `);
      const c = await pool.request().query(`SELECT COUNT(*) AS cnt FROM PSDetail WHERE Type='Sale'`);
      console.log(`\n=== ${cfg.name} ===`);
      console.log('Sales count:', c.recordset[0].cnt);
      console.table(r.recordset);
      await pool.close();
    } catch (e) {
      console.log(`\n=== ${cfg.name} === ERROR:`, e.message);
    }
  }
  process.exit(0);
})();
