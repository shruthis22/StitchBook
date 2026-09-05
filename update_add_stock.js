const fs = require('fs');
const path = 'app/(drawer)/add-stock/index.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('const [unit, setUnit]')) {
    code = code.replace(
        "const [remarks, setRemarks] = useState('');",
        "const [remarks, setRemarks] = useState('');\n  const [unit, setUnit] = useState<'Box' | 'Nos'>('Box');"
    );

    code = code.replace(
        "qty: numQty,\n      remarks: remarks || 'Manual Stock Addition',",
        "qty: numQty,\n      remarks: remarks || 'Manual Stock Addition',\n      unit: unit,"
    );

    code = code.replace(
        "const currentStock = (stockLedger || []).reduce((acc, curr) => {\n    return curr.type === 'IN' ? acc + curr.qty : acc - curr.qty;\n  }, 0);",
        `const currentStockBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => {
    return curr.type === 'IN' ? acc + curr.qty : acc - curr.qty;
  }, 0);
  const currentStockNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => {
    return curr.type === 'IN' ? acc + curr.qty : acc - curr.qty;
  }, 0);`
    );

    // Update UI for current stock display
    const stockUIRegex = /<View style=\{styles\.header\}>[\s\S]*?<Text style=\{styles\.headerTitle\}>Current Stock: \{currentStock\}<\/Text>[\s\S]*?<\/View>/;
    const newStockUI = `<View style={styles.header}>
        <Text style={styles.headerTitle}>Stock: {currentStockBoxes} Boxes | {currentStockNos} Nos</Text>
      </View>`;
    code = code.replace(stockUIRegex, newStockUI);

    // Add unit selector UI
    const inputUIRegex = /(<TextInput[\s\S]*?keyboardType="numeric"[\s\S]*?\/>\s*<\/View>)/;
    const unitUI = `$1

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.methodBtn, unit === 'Box' && styles.methodBtnActive]}
                    onPress={() => setUnit('Box')}
                  >
                    <Ionicons name="cube-outline" size={18} color={unit === 'Box' ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.methodBtnText, unit === 'Box' && styles.methodBtnTextActive]}>Box</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodBtn, unit === 'Nos' && styles.methodBtnActive]}
                    onPress={() => setUnit('Nos')}
                  >
                    <Ionicons name="apps-outline" size={18} color={unit === 'Nos' ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.methodBtnText, unit === 'Nos' && styles.methodBtnTextActive]}>Nos</Text>
                  </TouchableOpacity>
                </View>
              </View>
`;
    code = code.replace(inputUIRegex, unitUI);

    // Update list item to show unit
    code = code.replace(
        "<Text style={styles.historyQty}>{item.type === 'IN' ? '+' : '-'}{item.qty}</Text>",
        "<Text style={styles.historyQty}>{item.type === 'IN' ? '+' : '-'}{item.qty} {item.unit === 'Nos' ? 'Nos' : 'Box'}</Text>"
    );

    if (!code.includes('methodBtn:')) {
        code = code.replace(
            "saveButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },",
            `saveButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB',
  },
  methodBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  methodBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  methodBtnTextActive: { color: '#FFF' },`
        );
    }

    fs.writeFileSync(path, code, 'utf8');
    console.log('Updated add-stock');
} else {
    console.log('Already updated add-stock');
}
