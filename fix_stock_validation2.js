const fs = require('fs');
let code = fs.readFileSync('app/(drawer)/home/index.tsx', 'utf8');

// 1. Add stockLedger selector if not present
if (!code.includes('state.billing.stockLedger')) {
    code = code.replace(
        "const availableProducts = useSelector((state: RootState) => state.billing.products);\n  const customers = useSelector((state: RootState) => state.billing.customers);",
        "const availableProducts = useSelector((state: RootState) => state.billing.products);\n  const customers = useSelector((state: RootState) => state.billing.customers);\n  const stockLedger = useSelector((state: RootState) => state.billing.stockLedger);"
    );
}

// 2. Insert stock validation using exact CRLF-aware strings
const marker = "    // Start Loading\r\n    setIsSaving(true);";
const idx = code.indexOf(marker);

if (idx !== -1) {
    const stockCheck = `    // --- STOCK VALIDATION ---
    const requiredBoxes = cartItems.filter(item => item.type === 'product' && item.unit !== 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
    const requiredNos = cartItems.filter(item => item.type === 'product' && item.unit === 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
    const availableBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
    const availableNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);

    if (requiredBoxes > availableBoxes) {
      Alert.alert('Insufficient Stock', \`Need \${requiredBoxes} Boxes but only \${availableBoxes} available.\`);
      return;
    }
    if (requiredNos > availableNos) {
      Alert.alert('Insufficient Stock', \`Need \${requiredNos} Nos but only \${availableNos} available.\`);
      return;
    }

`;
    code = code.substring(0, idx) + stockCheck + code.substring(idx);
    fs.writeFileSync('app/(drawer)/home/index.tsx', code, 'utf8');
    console.log('Stock validation injected at index:', idx);
} else {
    console.log('Marker not found. Looking for LF-only version...');
    const markerLF = "    // Start Loading\n    setIsSaving(true);";
    const idx2 = code.indexOf(markerLF);
    if (idx2 !== -1) {
        const stockCheck = `    // --- STOCK VALIDATION ---
    const requiredBoxes = cartItems.filter(item => item.type === 'product' && item.unit !== 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
    const requiredNos = cartItems.filter(item => item.type === 'product' && item.unit === 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
    const availableBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
    const availableNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);

    if (requiredBoxes > availableBoxes) {
      Alert.alert('Insufficient Stock', \`Need \${requiredBoxes} Boxes but only \${availableBoxes} available.\`);
      return;
    }
    if (requiredNos > availableNos) {
      Alert.alert('Insufficient Stock', \`Need \${requiredNos} Nos but only \${availableNos} available.\`);
      return;
    }

`;
        code = code.substring(0, idx2) + stockCheck + code.substring(idx2);
        fs.writeFileSync('app/(drawer)/home/index.tsx', code, 'utf8');
        console.log('Stock validation injected (LF) at index:', idx2);
    } else {
        console.log('Could not find marker!');
    }
}
