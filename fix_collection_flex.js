const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /collectionSection: \{\s*flex: 1,\s*backgroundColor: '#FFFFFF'/g,
    "collectionSection: { backgroundColor: '#FFFFFF'"
);

// To make the top cards look a bit neater and productive with the space, let's just ensure they have a nice padding.
// They currently have padding: 14. Let's make it 18 again but keep the 48% width.
code = code.replace(
    /statCard: \{\s*width: '48%',\s*backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,/g,
    "statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,"
);
code = code.replace(
    /statValue: \{ fontSize: 20,/g,
    "statValue: { fontSize: 24,"
);

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed collection section flex');
