require('dotenv').config();
const sql = require('mssql');
(async () => {
  const p = await sql.connect({
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, port: 1433, database: process.env.DB_NAME,
    options: { trustServerCertificate: true },
  });
  const t = await p.request().query('SELECT DISTINCT Type FROM PSDetail ORDER BY Type');
  console.log('Types:', t.recordset.map((r) => r.Type));

  const sample = await p.request().input('pid', sql.Int, 562).query(`
    SELECT TOP 5 d.Date, d.Doc, d.Type, p.Qty, p.Rate, c.Subsidary AS party
    FROM PSProduct p
    INNER JOIN PSDetail d ON p.Doc = d.Doc AND p.Type = d.Type
    LEFT JOIN COA c ON d.Acid = c.Id
    WHERE p.Prid = @pid AND d.Type IN ('Sale','Purchase')
    ORDER BY d.Date DESC
  `);
  console.table(sample.recordset);
  await p.close();
  process.exit(0);
})();
