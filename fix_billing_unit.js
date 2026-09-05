const fs = require('fs');

let path1 = 'app/(drawer)/home/index.tsx';
let code1 = fs.readFileSync(path1, 'utf8');

// Now fix the stock deduction to use item.unit directly instead of looking up from availableProducts
// This ensures the unit saved to stock is exactly what was in the cart at billing time
code1 = code1.replace(
    `// Calculate boxes and nos separately
      const totalBoxesBilled = cartItems.filter(item => {
        if (item.type !== 'product') return false;
        const product = availableProducts.find(p => p.name === item.name);
        return product?.unit !== 'Nos';
      }).reduce((sum, item) => sum + Number(item.qty), 0);

      const totalNosBilled = cartItems.filter(item => {
        if (item.type !== 'product') return false;
        const product = availableProducts.find(p => p.name === item.name);
        return product?.unit === 'Nos';
      }).reduce((sum, item) => sum + Number(item.qty), 0);`,
    `// Calculate boxes and nos separately using item.unit directly
      const totalBoxesBilled = cartItems.filter(item => item.type === 'product' && item.unit !== 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);
      const totalNosBilled = cartItems.filter(item => item.type === 'product' && item.unit === 'Nos').reduce((sum, item) => sum + Number(item.qty), 0);`
);

// Fix cart display - use item.unit directly instead of looking up
code1 = code1.replace(
    `<Text style={styles.itemMeta}>Qty: {item.qty} {availableProducts.find(p => p.name === item.name)?.unit === 'Nos' ? 'Nos' : 'Box'} x ₹{item.rate.toFixed(2)}</Text>`,
    `<Text style={styles.itemMeta}>Qty: {item.qty} {item.unit === 'Nos' ? 'Nos' : 'Box'} × ₹{item.rate.toFixed(2)}</Text>`
);

fs.writeFileSync(path1, code1, 'utf8');
console.log('Fixed billing stock deduction and cart display');
