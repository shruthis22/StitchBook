const fs = require("fs");
let content = fs.readFileSync("app/(drawer)/history/[id].tsx", "utf-8");

// 1. Update useSelector to get customers
content = content.replace(
  "const bill = useSelector((state: RootState) =>\\n    state.billing.bills.find(b => b.id === billId)\\n  );",
  `const { bills, customers } = useSelector((state: RootState) => state.billing);
  const bill = bills.find(b => b.id === billId);
  const customer = customers?.find(c => c.name?.trim().toLowerCase() === bill?.customerName?.trim().toLowerCase());
  const displayPhone = bill?.customerPhone || customer?.phone || "N/A";`
);

// 2. Update rendering of customer info to fix overflow and use displayPhone
content = content.replace(
  /<Text style=\{styles\.infoText\}>\{bill\.customerName\}<\/Text>/,
  "<Text style={[styles.infoText, { flex: 1, flexWrap: \"wrap\" }]}>{bill.customerName}</Text>"
);

content = content.replace(
  /<Text style=\{styles\.infoText\}>\{bill\.customerPhone \|\| \x27N\/A\x27\}<\/Text>/,
  "<Text style={styles.infoText}>{displayPhone}</Text>"
);

fs.writeFileSync("app/(drawer)/history/[id].tsx", content);

