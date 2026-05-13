const fs = require('fs');

try {
    // File read karo
    let rawData = fs.readFileSync('data.json', 'utf8');

    // 1. Fix: Jahan objects jud rahe hain bina comma ke (e.g., }{ -> },{)
    let fixedData = rawData.replace(/}\s*{/g, '},{');

    // 2. Fix: Broken newlines ko remove karo jo strings ke beech mein aa gayi hain
    // Note: Ye step thoda risky hai agar data mein actual newlines chahiye,
    // par JSON standard mein strings mein newlines escaped honi chahiye (\n).
    // Hum assume kar rahe hain ki ye accidental line breaks hain.
    fixedData = fixedData.replace(/([^\\])"\s*[\r\n]+\s*"/g, '$1","'); 

    // 3. Specific fix for the snippet you showed (Res... Email)
    // Agar string beech mein toot gayi hai bina quote band kiye:
    // Iske liye manual ya aggressive regex chahiye hoga. 
    // Basic fix:
    fixedData = fixedData.replace(/\r?\n/g, ''); // Remove all raw newlines

    // Try to parse to check validity
    const parsedData = JSON.parse(fixedData);

    // Save formatted JSON
    fs.writeFileSync('fixed_data.json', JSON.stringify(parsedData, null, 2));
    console.log("Success! Fixed file saved as 'fixed_data.json'");

} catch (error) {
    console.error("Error fixing JSON:", error.message);
    // Agar automatic fix fail ho, toh error location batao
}