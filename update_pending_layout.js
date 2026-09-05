const fs = require('fs');
const path = 'app/(drawer)/pending-payments/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldRegex = /<View style=\{styles\.cardBody\}>[\s\S]*?<\/View>\s*<\/TouchableOpacity>/;

const newStr = `        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="receipt-outline" size={14} color="#6B7280" />
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>
              Bill: ₹{(Number(item.grandTotal) || Number(item.amount) || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />`;

if (oldRegex.test(code)) {
    code = code.replace(oldRegex, newStr);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Fixed pending payments layout');
} else {
    console.log('Regex not found');
}
