const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/home/index.tsx", "utf-8");

content = content.replace(
  /\/\/ --- STOCK VALIDATION ---[\s\S]*?(?=\/\/ Start Loading)/,
  `// --- STOCK VALIDATION PER PRODUCT ---
    const productItems = cartItems.filter(item => item.type === "product");
    for (const item of productItems) {
      // Find the product in the catalog
      const product = availableProducts.find(p => p.name === item.name);
      if (product) {
        // Calculate available stock for this specific product
        const availableStock = (stockLedger || [])
          .filter(s => s.productId === product.id)
          .reduce((acc, curr) => curr.type === "IN" ? acc + curr.qty : acc - curr.qty, 0);
        
        const requiredQty = Number(item.qty);
        if (requiredQty > availableStock) {
          Alert.alert("Insufficient Stock", \`You are billing \${requiredQty} of \${product.name} but only \${availableStock} available.\`);
          return;
        }
      }
    }

    `
);

content = content.replace(
  /\/\/ 2\. Deduct stock by unit type[\s\S]*?(?=\/\/ STOP LOADING IMMEDIATELY!)/,
  `// 2. Deduct stock per product
      productItems.forEach((item, index) => {
        const product = availableProducts.find(p => p.name === item.name);
        if (product) {
          // Stagger dispatches slightly to avoid rate limits
          setTimeout(() => {
            dispatch(saveStockEntryToGoogleSheets({
              id: Date.now().toString() + "_" + index,
              date: new Date().toISOString(),
              type: "OUT",
              qty: Number(item.qty),
              remarks: \`Billed to \${newBill.customerName}\`,
              referenceId: newBill.id,
              unit: product.unit || "Box",
              productId: product.id,
              productName: product.name
            })).unwrap().catch(e => console.warn("Stock deduct failed:", e));
          }, index * 60);
        }
      });
      
      `
);

fs.writeFileSync("app/(drawer)/home/index.tsx", content);
