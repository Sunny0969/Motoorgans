const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'data.json');
const outputPath = path.join(__dirname, 'data_fixed_v39.json');

console.log("🔥 REPAIRING V39 (THE COPY-PASTE SURGERY)...");

try {
    let content = fs.readFileSync(inputPath, 'utf-8');

    // --- 1. BASIC CLEANUP ---
    content = content.replace(/\(\d+ row[s]? affected\)/gi, '');
    content = content.replace(/Completion time:[\s\S]*?(\r\n|\n)/gi, '');
    content = content.replace(/[\r\n]+/g, ''); 

    // --- 2. THE SPECIFIC ERROR FIX ---
    console.log("... Applying Surgical Fix for Error 7002");

    // ERROR CONTEXT FROM YOUR LOG:
    // "sm":"","creditdays","","HFax"
    
    // SOLUTION:
    // "sm":"","creditdays":"","HFax"  (Comma -> Colon)

    // Hum exact text replace kar rahe hain taake ghalti ki gunjayish na rahe
    const badText  = '"sm":"","creditdays","","HFax"';
    const goodText = '"sm":"","creditdays":"","HFax"';

    if (content.indexOf('"sm":"","creditdays",""') !== -1) {
        console.log("🎯 TARGET FOUND! Replacing exact bad text...");
        // Hum chote tukray ko replace karenge taake agar HFax na ho to bhi chal jaye
        content = content.split('"sm":"","creditdays",""').join('"sm":"","creditdays":""');
    } else {
        console.log("⚠️ Exact text not found, trying slightly looser match...");
        // Agar upar wala fail ho to thoda loose match
        content = content.replace(/"creditdays"\s*,\s*""/g, '"creditdays":""');
    }

    // --- 3. PREVIOUS CRITICAL FIXES (HISTORY) ---
    
    // Diamond Autos (Urdu Fix)
    content = content.split(':"ڈائمند,"creditdays":').join(':"ڈائمند","creditdays":');

    // Date Fixer
    content = content.replace(/"Balance_Date":"([0-9]{4}-[0-9]{2}),"([a-zA-Z]+)/g, '"Balance_Date":"$1-01T00:00:00","$2');
    
    // Urdu Merger
    content = content.replace(/([0-9])uName":"/g, '$1,"UrduName":"');

    // Date Injector
    content = content.replace(/,(-[0-9]{2}-[0-9]{2}T)/g, ',"Date":"2021$1');

    // Urdu Quote
    content = content.replace(/([^"0-9]),"creditdays":/g, '$1","creditdays":');

    // Pricelist-Balance
    content = content.replace(/"pricelist":"W([0-9])/g, '"pricelist":"Whole Sale","Balance":$1');

    // City Fixes
    content = content.replace(/""UMERKOT"/g, '"City":"UMERKOT"');
    content = content.replace(/""([A-Z]+)"/g, '"City":"$1"');
    content = content.replace(/"HAddr"([a-zA-Z0-9])/g, '"HAddress":"$1');
    content = content.replace(/"UrduNa"pricelist"/g, '"UrduName":"","pricelist"');
    content = content.replace(/"UrduNa"([a-zA-Z0-9_]+)/g, '"UrduName":"","$1"');
    content = content.replace(/T00:00ress/g, 'T00:00:00","Address');
    content = content.replace(/"Balanc:"/g, '"Balance":');
    content = content.replace(/"Balanc":/g, '"Balance":');
    content = content.replace(/"ledgerno"([0-9])/g, '"ledgerno":$1');
    content = content.replace(/"Balance":","/g, '"Balance":"","');
    content = content.replace(/":","([a-zA-Z0-9_]+)"/g, '":"","$1"');
    content = content.replace(/T00_Date/g, 'T00:00:00","_Date');
    content = content.replace('Share Capital and Res"EMail"', 'Share Capital and Res","EMail"');
    content = content.replace(/,":"","/g, ',');
    content = content.replace(/, "": "",/g, ',');
    content = content.replace(/, ":" "",/g, ',');
    content = content.replace(/,([a-zA-Z0-9_]+)":/g, ',"$1":');
    content = content.replace(/"([a-zA-Z0-9_]+)"([0-9])/g, '"$1":$2');

    // --- 4. GENERAL CLEANUP ---
    content = content.replace(/([^:{\[,])""/g, '$1","');
    content = content.replace(/}\s*{/g, '},{');
    content = content.replace(/{","/g, '{"');
    content = content.replace(/,,/g, ',');

    // Save
    fs.writeFileSync(outputPath, content);
    console.log(`✅ File Saved to: ${path.basename(outputPath)}`);

    // --- 5. VALIDATION ---
    console.log("🔎 Validating JSON...");
    const parsedData = JSON.parse(content);
    console.log("\n🎉 MUBARAK HO! JSON VALID HAI!");
    
    const tables = parsedData.AllTablesData || parsedData.DatabaseExport;
    console.log(`Total Tables: ${tables.length}`);

    console.log("\n👉 IMPORTANT:");
    console.log("1. Ab 'seeder.js' mein jayen.");
    console.log("2. Line change karein: const dataFile = path.join(__dirname, 'data_fixed_v39.json');");
    console.log("3. Run: node seeder.js");

} catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes('position')) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
            const pos = parseInt(match[1]);
            const cleanContent = fs.readFileSync(outputPath, 'utf-8');
            console.log("\n--- ERROR CONTEXT ---");
            console.log(cleanContent.substring(pos - 80, pos + 80));
            console.log("          ^ (Yahan ghalti hai)");
        }
    }
}