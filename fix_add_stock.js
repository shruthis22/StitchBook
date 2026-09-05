const fs = require('fs');
const path = 'app/(drawer)/add-stock/index.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    "<Text style={styles.label}>Unit</Text>",
    "<Text style={styles.label}>Stock Unit</Text>\n                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>\n                    Are you adding Boxes or individual Numbers (Nos)?\n                  </Text>"
);

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed add stock structure');
