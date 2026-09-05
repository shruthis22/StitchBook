const fs = require('fs');

let path1 = 'redux/billSlice.ts';
let code1 = fs.readFileSync(path1, 'utf8');

code1 = code1.replace(
    /export interface BillItem \{[\s\S]*?type: 'product' \| 'labour';\r?\n\}/,
    "export interface BillItem {\n  id: string;\n  name: string;\n  qty: number;\n  rate: number;\n  amount: number;\n  type: 'product' | 'labour';\n  unit?: 'Box' | 'Nos';\n}"
);
fs.writeFileSync(path1, code1, 'utf8');
console.log('Fixed BillItem interface in Redux');
