const fs = require('fs');

let path1 = 'app/(drawer)/home/index.tsx';
let code1 = fs.readFileSync(path1, 'utf8');

code1 = code1.replace(
    /const newItem = \{\s*id: Date\.now\(\)\.toString\(\),\s*name: productName,\s*qty: quantity,\s*rate: unitPrice,\s*amount: quantity \* unitPrice,\s*type: 'product' as const\s*\};/,
    "const product = availableProducts.find(p => p.name === productName);\n    const newItem = {\n      id: Date.now().toString(),\n      name: productName,\n      qty: quantity,\n      rate: unitPrice,\n      amount: quantity * unitPrice,\n      type: 'product' as const,\n      unit: product?.unit || 'Box'\n    };"
);
fs.writeFileSync(path1, code1, 'utf8');
console.log('Fixed newItem unit mapping in home');
