const fs = require("fs");
const files = [
  "app/(drawer)/parties/index.tsx",
  "app/(drawer)/parties/[id].tsx",
  "app/(drawer)/history/index.tsx",
  "app/(drawer)/history/[id].tsx",
  "app/(drawer)/pending-payments/index.tsx",
  "app/(drawer)/home/index.tsx",
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    content = content.replace(/\.toFixed\(0\)/g, ".toLocaleString(\x27en-IN\x27)");
    fs.writeFileSync(file, content);
  }
});
