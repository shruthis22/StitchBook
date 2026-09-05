const fs = require('fs');
const path = 'app/(drawer)/add/index.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    "<Text style={styles.itemName}>{item.name}</Text>",
    "<Text style={styles.itemName}>{item.name} <Text style={{fontSize:12, color:'#9CA3AF', fontWeight:'500'}}>({item.unit === 'Nos' ? 'Nos' : 'Box'})</Text></Text>"
);

fs.writeFileSync(path, code, 'utf8');
console.log('Updated add product list');
