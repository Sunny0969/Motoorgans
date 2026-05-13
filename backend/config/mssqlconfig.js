const sql = require('mssql');
require('dotenv').config();

const dbServer = process.env.DB_SERVER || 'localhost';
const dbInstance = process.env.DB_INSTANCE;
const isLocalDb =
    dbServer.toLowerCase().includes('(localdb)') ||
    (dbInstance && dbInstance.toLowerCase() === 'mssqllocaldb');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Rathi@0969',
    server: dbServer,
    database: process.env.DB_NAME || 'TMS_Database',
    options: {
        trustServerCertificate: process.env.DB_TRUST_CERTIFICATE
            ? process.env.DB_TRUST_CERTIFICATE === 'true'
            : true,
        encrypt: process.env.DB_ENCRYPT === 'true',
        ...(dbInstance ? { instanceName: dbInstance } : {})
    },
    ...(dbInstance ? {} : { port: Number(process.env.DB_PORT || 1433) })
};

let poolPromise = null;

const connectDB = async () => {
    if (isLocalDb) {
        throw new Error(
            'MSSQLLocalDB is not supported by node-mssql/tedious. Use a full SQL Server service and set DB_SERVER=localhost with DB_PORT=1433, or set DB_INSTANCE to a TCP-enabled instance such as SQLEXPRESS.'
        );
    }

    if (!poolPromise) {
        poolPromise = sql.connect(config)
            .then((pool) => {
                console.log(`SQL Server connected: ${config.server}/${config.database}`);
                return pool;
            })
            .catch((err) => {
                poolPromise = null;
                throw err;
            });
    }

    return poolPromise;
};

const closeDB = async () => {
    if (!poolPromise) {
        return;
    }

    const pool = await poolPromise;
    poolPromise = null;
    await pool.close();
};

module.exports = { sql, config, connectDB, closeDB };