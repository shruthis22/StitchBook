const fs = require('fs');
const path = 'app/(drawer)/add-stock/index.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the old currentStock calculation
const oldCalcRegex = /const currentStock = \(stockLedger \|\| \[\]\)\.reduce\(\(acc, curr\) => \{\s*return curr\.type === 'IN' \? acc \+ curr\.qty : acc - curr\.qty;\s*\}, 0\);/;
if (oldCalcRegex.test(code)) {
    code = code.replace(oldCalcRegex, `const currentStockBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
  const currentStockNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);`);
}

// Replace the stockOverviewCard
const oldCardRegex = /<View style=\{styles\.stockOverviewCard\}>[\s\S]*?<\/View>/;
const newCards = `<View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={[styles.stockOverviewCard, { flex: 1, marginBottom: 0 }]}>
                  <Text style={styles.overviewLabel}>Total Boxes</Text>
                  <Text style={styles.overviewValue}>{currentStockBoxes}</Text>
                </View>
                <View style={[styles.stockOverviewCard, { flex: 1, marginBottom: 0 }]}>
                  <Text style={styles.overviewLabel}>Total Nos</Text>
                  <Text style={styles.overviewValue}>{currentStockNos}</Text>
                </View>
              </View>`;
if (oldCardRegex.test(code)) {
    code = code.replace(oldCardRegex, newCards);
}

// Remove the description for the selling unit
const descRegex = /<Text style=\{\{\s*fontSize: 12,\s*color: '#6B7280',\s*marginBottom: 8\s*\}\}>[\s\S]*?<\/Text>/;
if (descRegex.test(code)) {
    code = code.replace(descRegex, '');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed add-stock');
