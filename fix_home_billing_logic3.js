const fs = require('fs');
const path = 'app/(drawer)/home/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const s = code.indexOf("const totalBoxesBilled = cartItems.filter(item => item.type === 'product').reduce");
const s2 = code.indexOf("if (totalBoxesBilled > 0) {", s);
const e = code.indexOf("}", code.indexOf("catch(e =>", s2));

if (s !== -1 && e !== -1) {
    const newLogic = `// Calculate boxes and nos separately
      const totalBoxesBilled = cartItems.filter(item => {
        if (item.type !== 'product') return false;
        const product = products.find(p => p.name === item.name);
        return product?.unit !== 'Nos';
      }).reduce((sum, item) => sum + Number(item.qty), 0);

      const totalNosBilled = cartItems.filter(item => {
        if (item.type !== 'product') return false;
        const product = products.find(p => p.name === item.name);
        return product?.unit === 'Nos';
      }).reduce((sum, item) => sum + Number(item.qty), 0);

      if (totalBoxesBilled > 0) {
        await dispatch(saveStockEntryToGoogleSheets({
          id: Date.now().toString() + '_stock_box',
          date: new Date().toISOString(),
          type: 'OUT',
          qty: totalBoxesBilled,
          remarks: \`Billed to \${newBill.customerName || 'Unknown'} (Boxes)\`,
          referenceId: newBill.id,
          unit: 'Box'
        })).unwrap().catch(e => console.error("Stock err:", e));
      }
      
      if (totalNosBilled > 0) {
        await new Promise(res => setTimeout(res, 50)); // prevent ID collision
        await dispatch(saveStockEntryToGoogleSheets({
          id: Date.now().toString() + '_stock_nos',
          date: new Date().toISOString(),
          type: 'OUT',
          qty: totalNosBilled,
          remarks: \`Billed to \${newBill.customerName || 'Unknown'} (Nos)\`,
          referenceId: newBill.id,
          unit: 'Nos'
        })).unwrap().catch(e => console.error("Stock err:", e));
      }`;
      
    code = code.substring(0, s) + newLogic + code.substring(e + 1);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Fixed billing logic correctly!!!');
} else {
    console.log('Could not find endpoints in home', s, e);
}
