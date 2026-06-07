require('dotenv').config();
const sql = require('mssql');
(async () => {
  const p = await sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: 1433,
    database: process.env.DB_NAME,
    options: { trustServerCertificate: true, encrypt: false },
  });
  const r = await p.request().query('SELECT TOP 1 * FROM Products ORDER BY ID DESC');
  console.log('Columns:', Object.keys(r.recordset[0] || {}));
  console.log('Sample row:', r.recordset[0]);
  const m = await p.request().query('SELECT MAX(ID) AS maxId, MAX(code) AS maxCode FROM Products');
  console.log('Max:', m.recordset[0]);
  await p.close();
  process.exit(0);
})();
