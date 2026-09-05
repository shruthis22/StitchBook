const fs = require('fs');
let code = fs.readFileSync('app/(drawer)/home/index.tsx', 'utf8');

// 1. Add stockLedger to useSelector
code = code.replace(
    "const availableProducts = useSelector((state: RootState) => state.billing.products);\n  const customers = useSelector((state: RootState) => state.billing.customers);",
    "const availableProducts = useSelector((state: RootState) => state.billing.products);\n  const customers = useSelector((state: RootState) => state.billing.customers);\n  const stockLedger = useSelector((state: RootState) => state.billing.stockLedger);"
);

// 2. Add stock check right before setIsSaving(true)
const oldCheck = `    if (!customerName) {
      Alert.alert('Missing Info', 'Please enter customer name.');
      return;
    }

    // Start Loading
    setIsSaving(true);`;

const newCheck = `    if (!customerName) {
      Alert.alert('Missing Info', 'Please enter customer name.');
      return;
    }

    // --- STOCK VALIDATION ---
    const requiredBoxes = cartItems.filter(item => item.type === 'product' && item.unit !== 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
    const requiredNos = cartItems.filter(item => item.type === 'product' && item.unit === 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);

    const availableBoxes = (stockLedger || []).filter(s => s.unit !== 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);
    const availableNos = (stockLedger || []).filter(s => s.unit === 'Nos').reduce((acc, curr) => curr.type === 'IN' ? acc + curr.qty : acc - curr.qty, 0);

    if (requiredBoxes > availableBoxes) {
      Alert.alert(
        'Insufficient Box Stock',
        \`You need \${requiredBoxes} Boxes but only \${availableBoxes} are available in stock.\`
      );
      return;
    }

    if (requiredNos > availableNos) {
      Alert.alert(
        'Insufficient Nos Stock',
        \`You need \${requiredNos} Nos but only \${availableNos} are available in stock.\`
      );
      return;
    }

    // Start Loading
    setIsSaving(true);`;

code = code.replace(oldCheck, newCheck);

fs.writeFileSync('app/(drawer)/home/index.tsx', code, 'utf8');
console.log('Fixed stock validation in billing');
