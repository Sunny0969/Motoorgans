const sql = require("mssql");
const fs = require("fs");

const config = {
    user: "myuser",
    password: "MyStrongPassword123!",
    server: "localhost\\SQLEXPRESS",
    port: 1433,
    database: "TMSLatestNew",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function exportAllTables() {
    try {
        const pool = await sql.connect(config);

        console.log("Connected to SQL Server");

        const tableResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE='BASE TABLE'
            ORDER BY TABLE_NAME
        `);

        const tables = tableResult.recordset;

        console.log(`Found ${tables.length} tables`);

        if (!fs.existsSync("./exported")) {
            fs.mkdirSync("./exported");
        }

        for (let table of tables) {
            const tableName = table.TABLE_NAME;

            console.log(`Exporting: ${tableName}`);

            const data = await pool
                .request()
                .query(`SELECT * FROM [${tableName}]`);

            fs.writeFileSync(
                `./exported/${tableName}.json`,
                JSON.stringify(data.recordset, null, 2)
            );

            console.log(`✔ Saved: exported/${tableName}.json`);
        }

        console.log("\n🎉 EXPORT COMPLETED SUCCESSFULLY!\n");

        pool.close();
    } catch (err) {
        console.error("❌ ERROR:", err);
    }
}

exportAllTables();
