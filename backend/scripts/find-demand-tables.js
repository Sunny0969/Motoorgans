require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB } = require('../config/mssqlconfig');

(async () => {
  const pool = await connectDB();
  const r = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND (
        TABLE_NAME LIKE '%Demand%'
        OR TABLE_NAME LIKE '%DOrder%'
        OR TABLE_NAME LIKE 'DO%'
        OR TABLE_NAME LIKE '%D_O%'
      )
    ORDER BY TABLE_NAME
  `);
  console.log(r.recordset.map((x) => x.TABLE_NAME).join('\n') || '(no matching tables)');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
