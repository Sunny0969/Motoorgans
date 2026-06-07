require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB } = require('../config/mssqlconfig');

(async () => {
  const pool = await connectDB();
  await pool.request().query(`
    IF OBJECT_ID('DemandOrderDetail', 'U') IS NOT NULL DROP TABLE DemandOrderDetail;
    IF OBJECT_ID('DemandOrderHeader', 'U') IS NOT NULL DROP TABLE DemandOrderHeader;
  `);
  console.log('Dropped DemandOrder tables');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
