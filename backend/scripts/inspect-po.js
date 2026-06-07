require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB } = require('../config/mssqlconfig');

(async () => {
  const pool = await connectDB();
  const po = await pool.request().query(`
    SELECT TOP 3 Doc, Type, Date, Acid, invoice, Description
    FROM PSDetail WHERE Type = 'Purchase Order' ORDER BY Doc DESC
  `);
  console.log('PSDetail PO:', po.recordset);
  const tables = await pool.request().query(`
    SELECT name FROM sys.tables WHERE name LIKE '%PurchaseOrder%'
  `);
  console.log('Tables:', tables.recordset);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
