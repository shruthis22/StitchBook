const fs = require('fs');

// Fix history/[id].tsx
let path1 = 'app/(drawer)/history/[id].tsx';
let code1 = fs.readFileSync(path1, 'utf8');

// Fix the qty column header
code1 = code1.replace(
    `<Text style={[styles.th, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>`,
    `<Text style={[styles.th, { flex: 0.8, textAlign: 'center' }]}>Qty / Unit</Text>`
);

// Fix the qty column value - show qty + unit
code1 = code1.replace(
    `<Text style={[styles.td, { flex: 0.5, textAlign: 'center' }]}>{item.qty}</Text>`,
    `<Text style={[styles.td, { flex: 0.8, textAlign: 'center' }]}>{item.qty}{item.type === 'product' ? ' ' + ((item as any).unit === 'Nos' ? 'Nos' : 'Box') : ''}</Text>`
);

// Fix the product name column (flex 2 -> 1.7 to give space to qty)
code1 = code1.replace(
    `<Text style={[styles.td, { flex: 2 }]}>{item.name}</Text>`,
    `<Text style={[styles.td, { flex: 1.7 }]}>{item.name}</Text>`
);
code1 = code1.replace(
    `<Text style={[styles.th, { flex: 2 }]}>Item</Text>`,
    `<Text style={[styles.th, { flex: 1.7 }]}>Item</Text>`
);

fs.writeFileSync(path1, code1, 'utf8');
console.log('Fixed history details qty+unit display');

// Fix printBill.ts - already has unit but let's also update the column header
let path2 = 'utils/printBill.ts';
let code2 = fs.readFileSync(path2, 'utf8');

// Update the header row to say "Qty / Unit"
code2 = code2.replace(
    /<div class="cell center">Qty<\/div>/g,
    `<div class="cell center">Qty / Unit</div>`
);

// Make sure the (item as any) syntax is pure JS-safe in the template literal
code2 = code2.replace(
    `\${(item as any).unit === 'Nos' ? 'Nos' : 'Box'}`,
    `\${item.unit === 'Nos' ? 'Nos' : 'Box'}`
);

fs.writeFileSync(path2, code2, 'utf8');
console.log('Fixed printBill qty+unit header and display');

// Fix shareBill.ts same
let path3 = 'utils/shareBill.ts';
let code3 = fs.readFileSync(path3, 'utf8');

code3 = code3.replace(
    /<div class="cell center">Qty<\/div>/g,
    `<div class="cell center">Qty / Unit</div>`
);
code3 = code3.replace(
    `\${(item as any).unit === 'Nos' ? 'Nos' : 'Box'}`,
    `\${item.unit === 'Nos' ? 'Nos' : 'Box'}`
);

fs.writeFileSync(path3, code3, 'utf8');
console.log('Fixed shareBill qty+unit header and display');
