const fs = require('fs');

// Fix add product
let path1 = 'app/(drawer)/add/index.tsx';
let code1 = fs.readFileSync(path1, 'utf8');
code1 = code1.replace(/name,\s*price\s*\};/, "name,\n      price,\n      unit\n    };");
fs.writeFileSync(path1, code1, 'utf8');

// Fix add stock
let path2 = 'app/(drawer)/add-stock/index.tsx';
let code2 = fs.readFileSync(path2, 'utf8');
code2 = code2.replace(/remarks: remarks \|\| 'Manual Stock Addition',\s*\};/, "remarks: remarks || 'Manual Stock Addition',\n      unit,\n    };");
fs.writeFileSync(path2, code2, 'utf8');

console.log('Fixed unit payloads');
