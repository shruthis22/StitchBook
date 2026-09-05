const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Make statCards bigger
code = code.replace(
    /statCard: \{\s*width: '48%',\s*backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,/g,
    "statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 22,"
);
code = code.replace(
    /statValue: \{ fontSize: 24,/g,
    "statValue: { fontSize: 28,"
);

// 2. Fix breakdownRow (remove flex: 1 to stop stretching, make them neat)
code = code.replace(
    /breakdownRow: \{\s*flex: 1, flexDirection: 'row',/g,
    "breakdownRow: { flexDirection: 'row',"
);

// 3. Improve breakdownCard styling to make Cash and Online visible and neat
code = code.replace(
    /breakdownCard: \{ flex: 1, padding: 12 \},/g,
    "breakdownCard: { flex: 1, padding: 16, alignItems: 'center' },"
);
code = code.replace(
    /breakdownAmount: \{ fontSize: 18, fontWeight: '800', color: '#111827' \},/g,
    "breakdownAmount: { fontSize: 20, fontWeight: '800', color: '#111827' },"
);

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed dashboard sizing');
