const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/dashboard/index.tsx", "utf-8");

content = content.replace(
  "Tap to view directory \u2192",
  "Tap to view parties \u2192"
);

fs.writeFileSync("app/(drawer)/dashboard/index.tsx", content);

