const fs = require('fs');
const path = require('path');

const exportedDir = path.join(__dirname, 'exported');
const outputFile = path.join(__dirname, 'sql_export.json');

// List of 37 tables you need (excluding Temp tables)
const requiredTables = [
    'Area', 'billsignature', 'ClassofTransactionLevel', 'COA', 'Company', 
    'CountAmount', 'Country', 'CreditNote', 'DiscountSlab', 'DM', 
    'Employee', 'Employees', 'FinancialStatementLevel', 'Fridge', 
    'GroupofAccountsLevel', 'InOut', 'Ledgers', 'Locations', 'Log', 
    'loginsecurity', 'mailConfig', 'PartyDiscount', 'Products', 
    'PSDetail', 'PSProduct', 'Recipe', 'Salary', 'SalarySlips', 
    'SellingConditions', 'SPO', 'Stock', 'tblDay', 'tblDirectoryPath', 
    'tblMe', 'ToDoList', 'userpermissions', 'Vehicle'
];

console.log('Combining exported table files...\n');
console.log(`Looking for ${requiredTables.length} required tables\n`);

// Get files for required tables only
const files = requiredTables.map(table => `${table}.json`)
    .filter(file => fs.existsSync(path.join(exportedDir, file)));

console.log(`Found ${files.length} of ${requiredTables.length} required table files\n`);

const allTablesData = [];
let successCount = 0;
let errorCount = 0;

// Process each file
for (const file of files) {
    const filePath = path.join(exportedDir, file);
    const tableName = file.replace('.json', '');
    
    try {
        console.log(`Reading: ${file}...`);
        
        // Read the JSON file
        const content = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(content);
        
        // Ensure it's an array
        if (!Array.isArray(jsonData)) {
            console.log(`  ⚠️  Skipping: Not an array`);
            errorCount++;
            continue;
        }
        
        // Add to combined data
        allTablesData.push({
            TableName: tableName,
            JSONData: jsonData
        });
        
        console.log(`  ✅ ${jsonData.length} records`);
        successCount++;
        
    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errorCount++;
    }
}

// Create final JSON structure matching seeder.js format
const finalData = {
    AllTablesData: allTablesData
};

// Write combined file
fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2), 'utf8');

console.log('\n' + '='.repeat(60));
console.log('COMBINE COMPLETE!');
console.log('='.repeat(60));
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📦 Total tables: ${allTablesData.length}`);
console.log(`📄 Output file: ${outputFile}`);
console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
console.log('='.repeat(60));
console.log('\n✅ Now run: node seeder.js');

