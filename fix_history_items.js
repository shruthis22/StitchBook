const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/history/[id].tsx", "utf8");

// Look for how items are rendered
// Typically: {item.qty} x ?{item.rate}
content = content.replace(
  /\{item\.qty\} x/g,
  `{item.qty} {item.unit || "Box"} x`
);
content = content.replace(
  /\{item\.qty\}x/g,
  `{item.qty} {item.unit || "Box"} x`
);

fs.writeFileSync("app/(drawer)/history/[id].tsx", content);
console.log("Updated history items");

