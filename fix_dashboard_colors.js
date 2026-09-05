const fs = require('fs');
const path = 'app/(drawer)/dashboard/index.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/borderTopColor: '#EF4444'/g, "borderTopColor: '#1F2937'");
code = code.replace(/borderTopColor: '#10B981'/g, "borderTopColor: '#1F2937'");
code = code.replace(/borderTopColor: '#F59E0B'/g, "borderTopColor: '#1F2937'");
code = code.replace(/borderTopColor: '#6366F1'/g, "borderTopColor: '#1F2937'");

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed border colors');
