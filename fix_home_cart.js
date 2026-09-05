const fs = require('fs');
const path = 'app/(drawer)/home/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldLine = "<Text style={styles.itemMeta}>Qty: {item.qty} x ₹{item.rate.toFixed(2)}</Text>";
// We need to look up the unit from the products array!
const newLine = `<Text style={styles.itemMeta}>Qty: {item.qty} {products.find(p => p.name === item.name)?.unit === 'Nos' ? 'Nos' : 'Box'} x ₹{item.rate.toFixed(2)}</Text>`;

if (code.includes(oldLine)) {
    code = code.replace(oldLine, newLine);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Fixed cart UI in home');
} else {
    // maybe toFixed(2) is replaced with toLocaleString
    const oldLine2 = "<Text style={styles.itemMeta}>Qty: {item.qty} x ₹{item.rate.toLocaleString('en-IN')}</Text>";
    const newLine2 = `<Text style={styles.itemMeta}>Qty: {item.qty} {products.find(p => p.name === item.name)?.unit === 'Nos' ? 'Nos' : 'Boxes'} x ₹{item.rate.toLocaleString('en-IN')}</Text>`;
    
    // Actually the previous search output showed "toFixed(2)" is still there because it was rate.toFixed(2). Let's check both.
    if (code.includes(oldLine2)) {
        code = code.replace(oldLine2, newLine2);
        fs.writeFileSync(path, code, 'utf8');
        console.log('Fixed cart UI in home (toLocaleString)');
    } else {
        const regex = /<Text style=\{styles\.itemMeta\}>Qty: \{item\.qty\} x (.*?)<\/Text>/;
        code = code.replace(regex, `<Text style={styles.itemMeta}>{item.qty} {products.find(p => p.name === item.name)?.unit === 'Nos' ? 'Nos' : 'Boxes'} x $1</Text>`);
        fs.writeFileSync(path, code, 'utf8');
        console.log('Fixed cart UI with regex');
    }
}
