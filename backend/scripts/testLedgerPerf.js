const { connectDB, sql } = require('../config/mssqlconfig');

(async () => {
  const pool = await connectDB();
  const tests = [
    ['by Id DESC top 200', `
      SELECT TOP (200) l.Id, l.Acid, l.Date
      FROM Ledgers l
      ORDER BY l.Id DESC
    `],
    ['by Acid+dates', `
      SELECT TOP (500) l.Id, l.Acid, l.Date
      FROM Ledgers l
      WHERE l.Acid = @acid
        AND l.Date >= @fromDate AND l.Date < DATEADD(day, 1, @toDate)
      ORDER BY l.Date ASC, l.Id ASC
    `, (req) => req
      .input('acid', sql.Int, 16)
      .input('fromDate', sql.DateTime, new Date('2025-05-18'))
      .input('toDate', sql.DateTime, new Date('2026-05-18')),
    ],
  ];

  for (const [name, sqlText, bind] of tests) {
    const t = Date.now();
    let req = pool.request();
    if (bind) req = bind(req);
    const result = await req.query(sqlText);
    console.log(name, result.recordset.length, 'rows', Date.now() - t, 'ms');
  }
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
