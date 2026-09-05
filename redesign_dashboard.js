const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the UI block
const s = code.indexOf('<View style={styles.statsGrid}>');
const endIdx = code.indexOf('{/* Collection Summary */}');

if (s !== -1 && endIdx !== -1) {
    const newStatsGrid = `<View style={styles.statsGrid}>
            <TouchableOpacity style={[styles.statCard, { borderTopColor: '#EF4444', borderTopWidth: 3 }]} onPress={() => router.push('/(drawer)/pending-payments')} activeOpacity={0.8}>
              <Text style={styles.statLabel}>Total Pending</Text>
              <Text style={styles.statValue}>₹{totalPending.toLocaleString('en-IN')}</Text>
              <Text style={styles.statHint}>Tap to view details →</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={[styles.statCard, { borderTopColor: '#10B981', borderTopWidth: 3 }]} onPress={() => router.push('/(drawer)/parties')} activeOpacity={0.8}>
              <Text style={styles.statLabel}>Total Parties</Text>
              <Text style={styles.statValue}>{uniqueParties}</Text>
              <Text style={styles.statHint}>Tap to view directory →</Text>
            </TouchableOpacity>

            <View style={[styles.statCard, { borderTopColor: '#F59E0B', borderTopWidth: 3 }]}>
              <Text style={styles.statLabel}>Box Stock</Text>
              <Text style={styles.statValue}>{totalStocksBoxes.toLocaleString('en-IN')}</Text>
              <Text style={styles.statHint}>Boxes available</Text>
            </View>

            <View style={[styles.statCard, { borderTopColor: '#6366F1', borderTopWidth: 3 }]}>
              <Text style={styles.statLabel}>Nos Stock</Text>
              <Text style={styles.statValue}>{totalStocksNos.toLocaleString('en-IN')}</Text>
              <Text style={styles.statHint}>Numbers available</Text>
            </View>
          </View>
  
          `;
          
    const actualOld = code.substring(s, endIdx);
    code = code.replace(actualOld, newStatsGrid);
}

// Replace styles
const oldStylesRegex = /statCard: \{[\s\S]*?\},[\s\S]*?iconBadge: \{[\s\S]*?\},[\s\S]*?statValue: \{[\s\S]*?\},[\s\S]*?statLabel: \{[\s\S]*?\},[\s\S]*?statHint: \{[\s\S]*?\},/;

const newStyles = `statCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18,
      borderWidth: 1, borderColor: '#EAECF0',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
      justifyContent: 'center',
    },
    statValue: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },
    statLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    statHint: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },`;

if (oldStylesRegex.test(code)) {
    code = code.replace(oldStylesRegex, newStyles);
} else {
    // try replacing parts individually if regex fails
    console.log("Regex for styles didn't match. Doing manual replacement");
    code = code.replace(/iconBadge: \{[\s\S]*?\},/, '');
    code = code.replace(/statCard: \{[\s\S]*?\},/, `statCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18,
      borderWidth: 1, borderColor: '#EAECF0',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
      justifyContent: 'center',
    },`);
    code = code.replace(/statValue: \{[\s\S]*?\},/, `statValue: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },`);
    code = code.replace(/statLabel: \{[\s\S]*?\},/, `statLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },`);
    code = code.replace(/statHint: \{[\s\S]*?\},/, `statHint: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },`);
}

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed dashboard ui completely');
