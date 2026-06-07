require('dotenv').config();
const { connectDB, sql } = require('../config/mssqlconfig');

(async () => {
  try {
    await connectDB();
    const pool = await sql.connect();
    const db = await pool.request().query('SELECT DB_NAME() AS db');
    console.log('Connected DB:', db.recordset[0].db);

    const latest = await pool.request().query(`
      SELECT TOP 10 Doc, invoice, Type, Date, Amount, Acid
      FROM PSDetail WHERE Type = 'Sale'
      ORDER BY Doc DESC
    `);
    console.log('Latest sales:');
    console.table(latest.recordset);

    const count = await pool.request().query(`
      SELECT COUNT(*) AS cnt FROM PSDetail WHERE Type = 'Sale'
    `);
    console.log('Total sales count:', count.recordset[0].cnt);

    const types = await pool.request().query(`
      SELECT DISTINCT Type, COUNT(*) AS cnt FROM PSDetail GROUP BY Type ORDER BY cnt DESC
    `);
    console.log('PSDetail types:');
    console.table(types.recordset);

    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
