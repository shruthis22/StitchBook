const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('const totalStocksBoxes')) {
    code = code.replace(
        "const totalStocks = (stockLedger || []).reduce((acc, curr) =>\n      curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);",
        `const totalStocksBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
    const totalStocksNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);`
    );

    code = code.replace(
        "value={totalStocks.toLocaleString('en-IN')}",
        "value={`${totalStocksBoxes.toLocaleString('en-IN')} B | ${totalStocksNos.toLocaleString('en-IN')} N`}"
    );
    
    // Also change label slightly
    code = code.replace('label="Total Stocks"', 'label="Stock (Box | Nos)"');

    fs.writeFileSync(path, code, 'utf8');
    console.log('Updated dashboard');
} else {
    console.log('Already updated dashboard');
}
