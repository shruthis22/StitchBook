const fs = require('fs');
const path = 'app/(drawer)/history/[id].tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<Text style=\{styles\.itemMeta\}>Qty: \{item\.qty\} x (.*?)<\/Text>/;
code = code.replace(regex, `<Text style={styles.itemMeta}>{item.qty} {products?.find(p => p.name === item.name)?.unit === 'Nos' ? 'Nos' : 'Boxes'} x $1</Text>`);

// wait, products might not be destructured in history/[id].tsx!
// let's check if products is defined in the component.
if (!code.includes('const { bills, products }')) {
    code = code.replace('const { bills } = useSelector', 'const { bills, products } = useSelector');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed history details UI');
