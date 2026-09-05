const fs = require('fs');
let code = fs.readFileSync('app/(drawer)/home/index.tsx', 'utf8');

// 1. Add stockLedger selector after customers selector (line 35 area)
code = code.replace(
    "const availableProducts = useSelector((state: RootState) => state.billing.products);\n  const customers = useSelector((state: RootState) => state.billing.customers);",
    "const availableProducts = useSelector((state: RootState) => state.billing.products);\n  const customers = useSelector((state: RootState) => state.billing.customers);\n  const stockLedger = useSelector((state: RootState) => state.billing.stockLedger);"
);

// 2. Add unit to cartItems type
code = code.replace(
    "    type: 'product' | 'labour'\n  }[]>([]);",
    "    type: 'product' | 'labour';\n    unit?: 'Box' | 'Nos';\n  }[]>([]);"
);

// 3. Store unit when adding item to cart
code = code.replace(
    "      type: 'product' as const\n    };",
    "      type: 'product' as const,\n      unit: availableProducts.find(p => p.name === productName)?.unit || 'Box'\n    };"
);

// 4. Show unit in cart display
code = code.replace(
    "<Text style={styles.itemMeta}>Qty: {item.qty} x ₹{item.rate.toFixed(2)}</Text>",
    "<Text style={styles.itemMeta}>Qty: {item.qty} {item.unit === 'Nos' ? 'Nos' : 'Box'} × ₹{item.rate.toFixed(2)}</Text>"
);

// 5. Add stock validation + stock deduction logic BEFORE "// Start Loading"
const markerIdx = code.indexOf('    // Start Loading\n    setIsSaving(true);');
if (markerIdx !== -1) {
    const stockCode = `    // --- STOCK VALIDATION ---
    const requiredBoxes = cartItems.filter(item => item.type === 'product' && item.unit !== 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
    const requiredNos = cartItems.filter(item => item.type === 'product' && item.unit === 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
    const availableBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
    const availableNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
    if (requiredBoxes > availableBoxes) {
      Alert.alert('Insufficient Stock', \`You need \${requiredBoxes} Boxes but only \${availableBoxes} available in stock.\`);
      return;
    }
    if (requiredNos > availableNos) {
      Alert.alert('Insufficient Stock', \`You need \${requiredNos} Nos but only \${availableNos} available in stock.\`);
      return;
    }

`;
    code = code.substring(0, markerIdx) + stockCode + code.substring(markerIdx);
}

// 6. Update stock deduction to use item.unit directly
code = code.replace(
    "const totalBoxesBilled = cartItems.filter(item => item.type === 'product').reduce((sum, item) => sum + Number(item.qty), 0);",
    "const totalBoxesBilled = cartItems.filter(item => item.type === 'product' && item.unit !== 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);\n        const totalNosBilled = cartItems.filter(item => item.type === 'product' && item.unit === 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);"
);

// Replace single-block dispatch with two dispatches
const oldDispatch = `if (totalBoxesBilled > 0) {
          await dispatch(saveStockEntryToGoogleSheets({
            id: Date.now().toString() + '_stock',
            date: new Date().toISOString(),
            type: 'OUT',
            qty: totalBoxesBilled,
            remarks: \`Billed to \${newBill.customerName || 'Unknown'}\`,
            referenceId: newBill.id
          })).unwrap().catch(e => console.error("Stock err:", e));
        }`;

const newDispatch = `if (totalBoxesBilled > 0) {
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
          await new Promise(res => setTimeout(res, 50));
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

if (code.includes(oldDispatch)) {
    code = code.replace(oldDispatch, newDispatch);
}

fs.writeFileSync('app/(drawer)/home/index.tsx', code, 'utf8');
console.log('All fixes applied to home/index.tsx');
console.log('Has stockLedger selector:', code.includes('state.billing.stockLedger'));
console.log('Has stock validation:', code.includes('Insufficient Stock'));
console.log('Has unit in cart:', code.includes("unit?: 'Box' | 'Nos'"));
