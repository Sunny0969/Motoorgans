const fs = require('fs');
const path = require('path');

const s = fs.readFileSync(path.join(__dirname, '..', 'data_fixed_v39.json'), 'utf8');
const re = /"TableName":"([^"]+)"/g;
const set = new Set();
let m;
while ((m = re.exec(s))) set.add(m[1]);
let markers = 0;
let j = 0;
while ((j = s.indexOf('"TableName":', j)) !== -1) {
  markers++;
  j += 1;
}
console.log('TableName markers', markers);
console.log([...set].sort().join('\n'));
console.log('unique', set.size);
