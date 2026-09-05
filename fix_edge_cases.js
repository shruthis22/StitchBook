const fs = require('fs');
let code = fs.readFileSync('app/(drawer)/history/[id].tsx', 'utf8');

code = code.replace(/₹\{\(bill\.grandTotal\s*\|\|\s*0\)\s*\}/, "₹{Number(bill.grandTotal || 0).toLocaleString('en-IN')}");
code = code.replace(/₹\{bill\.pendingAmount\}/g, "₹{Number(bill.pendingAmount || 0).toLocaleString('en-IN')}");

fs.writeFileSync('app/(drawer)/history/[id].tsx', code, 'utf8');
console.log('Fixed edge cases in history/[id].tsx');
