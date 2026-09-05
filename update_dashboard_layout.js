const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const s = code.indexOf('<View style={styles.statsGrid}>');
const endIdx = code.indexOf('{/* Collection Summary */}');

if (s !== -1 && endIdx !== -1) {
    const newStatsGrid = `<View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(drawer)/pending-payments')} activeOpacity={0.8}>
              <View style={[styles.iconBadge, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              </View>
              <Text style={styles.statValue}>₹{totalPending.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Total Pending</Text>
              <Text style={styles.statHint}>Tap to view →</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(drawer)/parties')} activeOpacity={0.8}>
              <View style={[styles.iconBadge, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="people-outline" size={18} color="#059669" />
              </View>
              <Text style={styles.statValue}>{uniqueParties}</Text>
              <Text style={styles.statLabel}>Total Parties</Text>
              <Text style={styles.statHint}>Tap to view →</Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cube-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.statValue}>{totalStocksBoxes.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Box Stock</Text>
              <Text style={styles.statHint}>Total boxes</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconBadge, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="apps-outline" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.statValue}>{totalStocksNos.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Nos Stock</Text>
              <Text style={styles.statHint}>Total numbers</Text>
            </View>
          </View>
  
          `;
          
    const actualOld = code.substring(s, endIdx);
    code = code.replace(actualOld, newStatsGrid);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Successfully updated dashboard layout');
} else {
    console.log('Could not find statsGrid or Collection Summary');
}
