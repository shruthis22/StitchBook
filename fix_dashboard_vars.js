const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the old calculation using regex to handle whitespace/newlines robustly
const oldCalcRegex = /const totalStocks = \(stockLedger \|\| \[\]\)\.reduce\(\(acc, curr\) =>[\s\S]*?curr\.type === 'IN' \? acc \+ curr\.qty : acc - curr\.qty, 0\);/;

if (oldCalcRegex.test(code)) {
    code = code.replace(oldCalcRegex, `const totalStocksBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
  const totalStocksNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);`);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Fixed missing variables in dashboard');
} else {
    console.log('Regex did not match. Trying fallback...');
    // Fallback if not found
}
