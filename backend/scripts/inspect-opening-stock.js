require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB } = require('../config/mssqlconfig');

(async () => {
  const pool = await connectDB();
  const tables = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME LIKE '%Stock%' OR TABLE_NAME LIKE '%Opening%'
    ORDER BY TABLE_NAME
  `);
  console.log('Tables:', tables.recordset.map((x) => x.TABLE_NAME).join(', '));

  const types = await pool.request().query(`SELECT DISTINCT Type FROM PSDetail ORDER BY Type`);
  console.log('PSDetail Types:', types.recordset.map((x) => x.Type).join(', '));

  const stockCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Stock' ORDER BY ORDINAL_POSITION
  `);
  console.log('\nStock columns:');
  stockCols.recordset.forEach((c) => console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

  const sample = await pool.request().query(`
    SELECT TOP 3 * FROM Stock WHERE Type LIKE '%Open%' OR Type = 'Opening'
  `);
  console.log('\nSample Opening Stock rows:', sample.recordset);

  const stockTypes = await pool.request().query(`SELECT DISTINCT Type FROM Stock ORDER BY Type`);
  console.log('\nStock Types:', stockTypes.recordset.map((x) => x.Type).join(', '));

  const sampleStock = await pool.request().query(`SELECT TOP 5 Doc, Type, Date, Prid, Qty, locationid FROM Stock ORDER BY Doc DESC`);
  console.log('\nRecent Stock:', sampleStock.recordset);

  const locs = await pool.request().query(`
    SELECT TOP 10 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%loc%'
  `);
  console.log('\nLocation tables:', locs.recordset);

  const ts = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tempstock' ORDER BY ORDINAL_POSITION
  `);
  console.log('\ntempstock cols:', ts.recordset.map((x) => x.COLUMN_NAME).join(', '));

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
