const { connectDB, closeDB } = require('./mssqlconfig');

const initializeDatabase = async () => {
  return connectDB();
};

const testConnection = async () => {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT
      DB_NAME() AS databaseName,
      @@SERVERNAME AS serverName,
      CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(128)) AS version,
      CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128)) AS edition
  `);

  return result.recordset[0];
};

module.exports = { initializeDatabase, testConnection, connectDB, closeDB };

