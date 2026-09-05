const fs = require('fs');
const path = 'app/(drawer)/home/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldStockLogic = `const totalBoxesBilled = cartItems.filter(item => item.type === 'product').reduce((sum, item) => sum + Number(item.qty), 0);
        if (totalBoxesBilled > 0) {
          await dispatch(saveStockEntryToGoogleSheets({
            id: Date.now().toString() + '_stock',
            date: new Date().toISOString(),
            type: 'OUT',
            qty: totalBoxesBilled,
            remarks: \`Billed: \${newBill.id}\`,
            referenceId: newBill.id
          }));
        }`;

const newStockLogic = `const totalBoxesBilled = cartItems.filter(item => {
          const product = products.find(p => p.name === item.name);
          return product?.unit !== 'Nos';
        }).reduce((sum, item) => sum + Number(item.qty), 0);

        const totalNosBilled = cartItems.filter(item => {
          const product = products.find(p => p.name === item.name);
          return product?.unit === 'Nos';
        }).reduce((sum, item) => sum + Number(item.qty), 0);

        if (totalBoxesBilled > 0) {
          await dispatch(saveStockEntryToGoogleSheets({
            id: Date.now().toString() + '_stock_box',
            date: new Date().toISOString(),
            type: 'OUT',
            qty: totalBoxesBilled,
            remarks: \`Billed: \${newBill.id} (Boxes)\`,
            referenceId: newBill.id,
            unit: 'Box'
          }));
        }
        
        if (totalNosBilled > 0) {
          await dispatch(saveStockEntryToGoogleSheets({
            id: Date.now().toString() + '_stock_nos',
            date: new Date().toISOString(),
            type: 'OUT',
            qty: totalNosBilled,
            remarks: \`Billed: \${newBill.id} (Nos)\`,
            referenceId: newBill.id,
            unit: 'Nos'
          }));
        }`;

if (code.includes('const totalBoxesBilled = cartItems.filter(item => item.type === \'product\')')) {
    code = code.replace(oldStockLogic, newStockLogic);
    fs.writeFileSync(path, code, 'utf8');
    console.log('Updated home stock deduction');
} else {
    console.log('Already updated or could not find old logic in home');
}
