const fs = require('fs');

const methodBtnStyles = `
  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB',
  },
  methodBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  methodBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  methodBtnTextActive: { color: '#FFF' },
`;

function injectStyles(path) {
    let code = fs.readFileSync(path, 'utf8');
    if (!code.includes('methodBtn: {')) {
        // Find the last closing brace of StyleSheet.create
        const ssIndex = code.lastIndexOf('});');
        if (ssIndex !== -1) {
            code = code.substring(0, ssIndex) + methodBtnStyles + code.substring(ssIndex);
            fs.writeFileSync(path, code, 'utf8');
            console.log('Injected styles into', path);
        }
    }
}

injectStyles('app/(drawer)/add/index.tsx');
injectStyles('app/(drawer)/add-stock/index.tsx');

// Also update the manage stocks header layout
let addStockCode = fs.readFileSync('app/(drawer)/add-stock/index.tsx', 'utf8');
const oldCards = /<View style=\{\{ flexDirection: 'row', gap: 12, marginBottom: 16 \}\}>[\s\S]*?<\/View>\s*<\/View>/;

const newCards = `<View style={[styles.stockOverviewCard, { flexDirection: 'row', padding: 0, marginBottom: 16 }]}>
                <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={styles.overviewLabel}>Total Boxes</Text>
                  <Text style={[styles.overviewValue, { marginTop: 4 }]}>{currentStockBoxes}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: '#374151', marginVertical: 20 }} />
                <View style={{ flex: 1, alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={styles.overviewLabel}>Total Nos</Text>
                  <Text style={[styles.overviewValue, { marginTop: 4 }]}>{currentStockNos}</Text>
                </View>
              </View>`;

if (oldCards.test(addStockCode)) {
    addStockCode = addStockCode.replace(oldCards, newCards);
    fs.writeFileSync('app/(drawer)/add-stock/index.tsx', addStockCode, 'utf8');
    console.log('Fixed add-stock cards layout');
} else {
    // If it didn't match perfectly, let's try a safer replace
    console.log('Regex failed, trying manual replace...');
    const startStr = "<View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>";
    const endStr = "</View>\n              </View>";
    
    // just use replace directly on what we injected last time
    let s = addStockCode.indexOf(startStr);
    if (s !== -1) {
        let e = addStockCode.indexOf("              </View>", s); // end of row view
        let actualOld = addStockCode.substring(s, e + "              </View>".length);
        addStockCode = addStockCode.replace(actualOld, newCards);
        fs.writeFileSync('app/(drawer)/add-stock/index.tsx', addStockCode, 'utf8');
        console.log('Fixed add-stock cards layout (manual)');
    }
}

