const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/home/index.tsx", "utf8");

// Fix handleAddItem to stamp unit from product catalog
content = content.replace(
  `const newItem = {
        id: Date.now().toString(),
        name: productName,
        qty: quantity,
        rate: unitPrice,
        amount: quantity * unitPrice,
        type: \x27product\x27 as const
      };`,
  `const BOX_PRODUCTS = ["rex prime", "rex 90", "sun 90"];
      const isBox = BOX_PRODUCTS.includes(productName.toLowerCase().trim());
      const newItem = {
        id: Date.now().toString(),
        name: productName,
        qty: quantity,
        rate: unitPrice,
        amount: quantity * unitPrice,
        type: \x27product\x27 as const,
        unit: (isBox ? \x27Box\x27 : \x27Nos\x27) as \x27Box\x27 | \x27Nos\x27
      };`
);

fs.writeFileSync("app/(drawer)/home/index.tsx", content);
console.log("Done");

