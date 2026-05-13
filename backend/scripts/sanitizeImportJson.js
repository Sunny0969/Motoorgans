/**
 * Sanitize legacy export JSON so JSON.parse succeeds.
 * Run: node scripts/sanitizeImportJson.js
 * Reads ../data_fixed_v39.json, writes ../data_fixed_v39.sanitized.json
 */
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'data_fixed_v39.json');
const outputPath = path.join(__dirname, '..', 'data_fixed_v39.sanitized.json');

function applySanitizers(content) {
  let s = content;

  // Missing colon after creditdays (value empty, next key quoted)
  s = s.replace(/"creditdays","","([A-Za-z_]+)"/g, '"creditdays":"","$1"');

  // Same pattern other numeric-looking keys broken as key,value without colon
  s = s.replace(/"ledgerno","","([A-Za-z_]+)"/g, '"ledgerno":"","$1"');

  // Broken Date + scientific number (export merge); restore valid JSON
  s = s.replace(/"Date(0+e\+\d+)/g, '"Date":"1970-01-01T00:00:00","_importNumber":"$1"');
  s = s.replace(/"Date(\d+\.\d+e\+\d+)/g, '"Date":"1970-01-01T00:00:00","_importNumber":"$1"');

  // Orphan key fragments like ":"","pricelist"
  s = s.replace(/":"",""pricelist"/g, ',"pricelist"');

  // Broken Subsidary + ISO date merged (missing quote/colon; year may miss leading "2")
  s = s.replace(
    /"Subsida(\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})"/g,
    '"Subsidary":"","Balance_Date":"2$1"'
  );
  s = s.replace(
    /"Subsida(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})"/g,
    '"Subsidary":"","Balance_Date":"$1"'
  );

  s = s.replace(/Whole le Sale/g, 'Whole Sale');

  // Empty string followed by stray empty pair before next key: "" , "" , "key"
  s = s.replace(/""\s*,\s*""\s*,\s*"/g, '"",');

  // Pattern: "" , " , "key  (stray quote between commas)
  s = s.replace(/""\s*,\s*",\s*"/g, '"",');

  // Missing opening quote on key: ,keyname":
  s = s.replace(/,([a-z][a-z0-9_]*)"\s*:/gi, ',"$1":');

  // Missing comma between string value and next key (legacy repair)
  s = s.replace(/Share Capital and Res"EMail"/g, 'Share Capital and Res","EMail"');

  // Double-empty between keys
  s = s.replace(/""([A-Z][a-z]+)":/g, '","$1":');

  s = s.replace(/,,+/g, ',');
  s = s.replace(/\[\s*,/g, '[');
  s = s.replace(/,\s*\]/g, ']');

  return s;
}

function main() {
  let content = fs.readFileSync(inputPath, 'utf8');
  let lastErr = null;
  for (let pass = 0; pass < 20; pass++) {
    content = applySanitizers(content);
    try {
      JSON.parse(content);
      fs.writeFileSync(outputPath, content);
      console.log('OK wrote', path.basename(outputPath), 'passes', pass + 1);
      return;
    } catch (e) {
      lastErr = e;
      const match = e.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1], 10);
        const ctx = content.slice(Math.max(0, pos - 100), pos + 100);
        console.warn('Pass', pass + 1, 'fail at', pos, '\n---\n', ctx, '\n---');
      }
    }
  }
  console.error('Could not fix JSON:', lastErr && lastErr.message);
  process.exit(1);
}

main();
