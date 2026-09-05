const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/parties/index.tsx", "utf-8");

content = content.replace(
  /<View>\s*<Text style=\{styles.partyName\}>\{item.name\}<\/Text>/,
  "<View style={{ flex: 1, paddingRight: 8 }}>\n            <Text style={styles.partyName} numberOfLines={1}>{item.name}</Text>"
);

fs.writeFileSync("app/(drawer)/parties/index.tsx", content);

