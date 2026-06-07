require('dotenv').config();
const sql = require('mssql');

(async () => {
const pool = await sql.connect({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  database: 'TMSLatestNew',
  options: { trustServerCertificate: true, encrypt: false },
});

const latest = await pool.request().query(`
  SELECT TOP 10 Doc, invoice, Date, Amount, Acid
  FROM PSDetail WHERE Type='Sale' ORDER BY Doc DESC
`);
console.log('Latest 10 sales in TMSLatestNew:');
console.table(latest.recordset);

const withInv = await pool.request().query(`
  SELECT TOP 10 Doc, invoice, Date, Amount
  FROM PSDetail WHERE Type='Sale' AND invoice IS NOT NULL AND invoice <> '' AND invoice <> '0'
  ORDER BY Doc DESC
`);
console.log('\nLatest with real invoice numbers:');
console.table(withInv.recordset);

const invStats = await pool.request().query(`
  SELECT COUNT(*) AS total,
    SUM(CASE WHEN invoice='0' OR invoice IS NULL OR invoice='' THEN 1 ELSE 0 END) AS zeroOrEmpty
  FROM PSDetail WHERE Type='Sale'
`);
console.log('\nInvoice stats:', invStats.recordset[0]);

await pool.close();
process.exit(0);
})();
