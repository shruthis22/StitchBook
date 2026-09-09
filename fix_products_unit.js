const fs = require("fs");
let content = fs.readFileSync("redux/billSlice.ts", "utf8");

// Fix: Replace the unit mapping in fetchProductsFromGoogleSheets
content = content.replace(
  /unit: p\.unit === .Nos. \? .Nos. : .Box./g,
  `unit: (() => { const BOX_PRODUCTS = ["rex prime","rex 90","sun 90"]; return BOX_PRODUCTS.includes(String(p.name).toLowerCase().trim()) ? "Box" : "Nos"; })()`
);

// Fix handleAddItem unit stamp in home index — we do that separately
fs.writeFileSync("redux/billSlice.ts", content);
console.log("Done. Occurrences replaced:", (content.match(/BOX_PRODUCTS/g) || []).length);

