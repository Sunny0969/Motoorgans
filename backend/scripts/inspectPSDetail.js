const { connectDB } = require('../config/mssqlconfig');

(async () => {
  const pool = await connectDB();
  const cols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'PSDetail' ORDER BY ORDINAL_POSITION
  `);
  console.log(cols.recordset.map((r) => r.COLUMN_NAME).join(', '));
  const count = await pool.request().query('SELECT COUNT(*) n FROM PSDetail WITH (NOLOCK)');
  console.log('rows', count.recordset[0].n);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
