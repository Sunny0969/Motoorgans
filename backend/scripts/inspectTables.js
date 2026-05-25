const { connectDB } = require('../config/mssqlconfig');

(async () => {
  const pool = await connectDB();
  for (const table of ['Stock', 'SPO']) {
    const r = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);
    console.log(table, r.recordset);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
