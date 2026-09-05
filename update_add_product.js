const fs = require('fs');
const path = 'app/(drawer)/add/index.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('const [unit, setUnit]')) {
    code = code.replace(
        "const [price, setPrice] = useState('');",
        "const [price, setPrice] = useState('');\n  const [unit, setUnit] = useState<'Box' | 'Nos'>('Box');"
    );

    code = code.replace(
        "const newProduct = {\n      id: Date.now().toString(),\n      name,\n      price\n    };",
        "const newProduct = {\n      id: Date.now().toString(),\n      name,\n      price,\n      unit\n    };"
    );

    // Add UI
    const uiRegex = /(<TextInput[\s\S]*?keyboardType="numeric"[\s\S]*?\/>\s*<\/View>)/;
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
    code = code.replace(uiRegex, unitUI);

    // Add styles if missing
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
    console.log('Updated add product');
} else {
    console.log('Already updated add product');
}
