const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/database');

// Config
dotenv.config();

// YAHAN FILE NAME BADLO (jo bhi repair script use ki us ki output file)
const dataFile = path.join(__dirname, 'sql_export.json'); 

// Table mapping
const tableMapping = {
    'Area': 'area',
    'billsignature': 'billsignature',
    'ClassofTransactionLevel': 'class_transaction_level',
    'COA': 'chart_of_accounts',
    'Company': 'company',
    'CountAmount': 'count_amount',
    'Country': 'country',
    'CreditNote': 'credit_note',
    'DiscountSlab': 'discount_slab',
    'DM': 'dm',
    'Employee': 'employee',
    'Employees': 'employees',
    'FinancialStatementLevel': 'financial_statement_level',
    'Fridge': 'fridge',
    'GroupofAccountsLevel': 'group_accounts_level',
    'InOut': 'in_out',
    'Ledgers': 'ledgers',
    'Locations': 'locations',
    'Log': 'log',
    'loginsecurity': 'login_security',
    'mailConfig': 'mail_config',
    'PartyDiscount': 'party_discount',
    'Products': 'products',
    'PSDetail': 'ps_detail',
    'PSProduct': 'ps_product',
    'Recipe': 'recipe',
    'Salary': 'salary',
    'SalarySlips': 'salary_slips',
    'SellingConditions': 'selling_conditions',
    'SPO': 'spo',
    'Stock': 'stock',
    'tblDay': 'tbl_day',
    'tblDirectoryPath': 'tbl_directory_path',
    'tblMe': 'tbl_me',
    'ToDoList': 'todo_list',
    'userpermissions': 'user_permissions',
    'Vehicle': 'vehicle'
};

const importData = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log("✅ Database connected!\n");
        
        // Check if file exists
        if (!fs.existsSync(dataFile)) {
            throw new Error(`File not found: ${dataFile}`);
        }
        
        console.log(`📖 Reading: ${path.basename(dataFile)}...`);
        const fileSize = fs.statSync(dataFile).size;
        console.log(`   File size: ${(fileSize / 1024).toFixed(2)} KB\n`);
        
        // Read and parse with error handling
        let rawData, parsedData;
        
        try {
            rawData = fs.readFileSync(dataFile, 'utf-8');
            console.log(`📄 File loaded: ${rawData.length} characters`);
        } catch (readError) {
            throw new Error(`File read failed: ${readError.message}`);
        }
        
        try {
            parsedData = JSON.parse(rawData);
            console.log("✅ JSON parsed successfully!\n");
        } catch (parseError) {
            console.error("❌ JSON PARSE ERROR:");
            console.error(`   ${parseError.message}`);
            
            if (parseError.message.includes('position')) {
                const match = parseError.message.match(/position (\d+)/);
                if (match) {
                    const pos = parseInt(match[1]);
                    console.error("\n🎯 ERROR LOCATION:");
                    console.error(rawData.substring(Math.max(0, pos - 60), pos));
                    console.error(">>> [" + rawData.charAt(pos) + "] <<<");
                    console.error(rawData.substring(pos + 1, Math.min(rawData.length, pos + 60)));
                }
            }
            
            throw new Error("JSON is invalid. Please run repair script first!");
        }

        // Get tables data
        const tables = parsedData.AllTablesData || parsedData.DatabaseExport || parsedData;

        if (!tables) {
            throw new Error("No tables found in JSON structure!");
        }

        if (!Array.isArray(tables)) {
            throw new Error("Tables data is not an array!");
        }

        console.log(`📦 Found ${tables.length} tables to process\n`);
        console.log("─".repeat(60));

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        // Process each table
        for (let i = 0; i < tables.length; i++) {
            const tableObj = tables[i];
            const sqlTableName = tableObj.TableName;
            
            if (!sqlTableName) {
                console.log(`⚠️  Skipping table ${i + 1}: No TableName found`);
                skipCount++;
                continue;
            }

            let tableRows = tableObj.JSONData;

            // Parse if string
            if (typeof tableRows === 'string') {
                try {
                    tableRows = JSON.parse(tableRows);
                } catch (e) {
                    console.log(`⚠️  Skipping ${sqlTableName}: JSONData parse failed`);
                    skipCount++;
                    continue;
                }
            }

            // Validate array
            if (!Array.isArray(tableRows)) {
                console.log(`⚠️  Skipping ${sqlTableName}: JSONData is not an array`);
                skipCount++;
                continue;
            }

            // Get collection name
            const collectionName = tableMapping[sqlTableName] || sqlTableName.toLowerCase();

            console.log(`\n[${i + 1}/${tables.length}] ${sqlTableName}`);
            console.log(`   → MongoDB Collection: ${collectionName}`);
            console.log(`   → Rows: ${tableRows.length}`);

            if (tableRows.length === 0) {
                console.log(`   ⚠️  Empty table, skipping...`);
                skipCount++;
                continue;
            }

            try {
                // Drop existing collection to avoid duplicate key errors
                try {
                    await mongoose.connection.db.collection(collectionName).drop();
                    console.log(`   🗑️  Dropped existing collection`);
                } catch (dropError) {
                    // Collection doesn't exist, that's fine
                }
                
                // Insert into MongoDB
                await mongoose.connection.db
                    .collection(collectionName)
                    .insertMany(tableRows, { ordered: false }); // ordered: false means continue even if some fail
                
                console.log(`   ✅ Imported successfully!`);
                successCount++;
                
            } catch (insertError) {
                console.error(`   ❌ Import failed: ${insertError.message}`);
                errorCount++;
            }
        }

        console.log("\n" + "─".repeat(60));
        console.log("\n📊 IMPORT SUMMARY:");
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ⚠️  Skipped: ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📦 Total: ${tables.length}`);
        
        if (successCount > 0) {
            console.log("\n🎉 DATA IMPORT COMPLETE!");
        } else {
            console.log("\n⚠️  No data was imported successfully.");
        }
        
        process.exit(0);

    } catch (error) {
        console.error("\n❌ FATAL ERROR:");
        console.error(`   ${error.message}`);
        console.error("\n💡 TROUBLESHOOTING:");
        console.error("   1. Make sure data file exists and path is correct");
        console.error("   2. Run JSON repair script first");
        console.error("   3. Check MongoDB connection in .env");
        console.error("   4. Verify file permissions");
        process.exit(1);
    }
};

// Run
console.log("🚀 STARTING DATA IMPORT...");
console.log("=".repeat(60) + "\n");
importData();