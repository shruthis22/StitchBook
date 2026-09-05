const fs = require('fs');
const path = 'app/(drawer)/add/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const descRegex = /<Text style=\{\{\s*fontSize: 12,\s*color: '#6B7280',\s*marginBottom: 8\s*\}\}>[\s\S]*?<\/Text>/;
if (descRegex.test(code)) {
    code = code.replace(descRegex, '');
    fs.writeFileSync(path, code, 'utf8');
    console.log('Removed description from add product');
}
