const fs = require('fs');

// Fix history/[id].tsx - show unit in bill items
let path2 = 'app/(drawer)/history/[id].tsx';
let code2 = fs.readFileSync(path2, 'utf8');

code2 = code2.replace(
    `<Text style={styles.itemMeta}>{item.qty} {products?.find(p => p.name === item.name)?.unit === 'Nos' ? 'Nos' : 'Boxes'} x `,
    `<Text style={styles.itemMeta}>{item.qty} {(item as any).unit === 'Nos' ? 'Nos' : 'Box'} × `
);

fs.writeFileSync(path2, code2, 'utf8');
console.log('Fixed history details unit display');

// Fix printBill.ts - show unit in PDF invoice table
let path3 = 'utils/printBill.ts';
let code3 = fs.readFileSync(path3, 'utf8');

code3 = code3.replace(
    `<div class="cell center">\${item.qty}</div>`,
    `<div class="cell center">\${item.qty} \${(item as any).unit === 'Nos' ? 'Nos' : 'Box'}</div>`
);

fs.writeFileSync(path3, code3, 'utf8');
console.log('Fixed printBill unit display');

// Fix shareBill.ts too
let path4 = 'utils/shareBill.ts';
let code4 = fs.readFileSync(path4, 'utf8');

code4 = code4.replace(
    `<div class="cell center">\${item.qty}</div>`,
    `<div class="cell center">\${item.qty} \${(item as any).unit === 'Nos' ? 'Nos' : 'Box'}</div>`
);

fs.writeFileSync(path4, code4, 'utf8');
console.log('Fixed shareBill unit display');
