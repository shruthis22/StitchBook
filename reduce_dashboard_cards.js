const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldGrid = "statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },";
const newGrid = "statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },";

if (code.includes(oldGrid)) {
    code = code.replace(oldGrid, newGrid);
}

const oldStylesRegex = /statCard: \{[\s\S]*?\},[\s\S]*?statValue: \{[\s\S]*?\},[\s\S]*?statLabel: \{[\s\S]*?\},[\s\S]*?statHint: \{[\s\S]*?\},/;

const newStyles = `statCard: {
      width: '48%',
      backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: '#EAECF0',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
      justifyContent: 'center',
    },
    statValue: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
    statLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    statHint: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },`;

if (oldStylesRegex.test(code)) {
    code = code.replace(oldStylesRegex, newStyles);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Fixed dashboard layout scaling');
} else {
    console.log("Regex didn't match.");
}
