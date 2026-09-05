const fs = require("fs");
let content = fs.readFileSync("redux/billSlice.ts", "utf-8");

content = content.replace(
  /unit\?: .Box. \| .Nos.;\r?\n\}/,
  "unit?: \"Box\" | \"Nos\";\n  productId?: string;\n  productName?: string;\n}"
);

content = content.replace(
  /unit: s.unit === .Nos. \? .Nos. : .Box.\r?\n\s*\}\)\) as StockLedger\[\];/,
  "unit: s.unit === \"Nos\" ? \"Nos\" : \"Box\",\n          productId: s.productId ? String(s.productId) : undefined,\n          productName: s.productName ? String(s.productName) : undefined\n        })) as StockLedger[];"
);

fs.writeFileSync("redux/billSlice.ts", content);
