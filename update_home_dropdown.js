const fs = require('fs');
const path = 'app/(drawer)/home/index.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    "<Text style={styles.dropdownItemName}>{item.name}</Text>",
    "<Text style={styles.dropdownItemName}>{item.name} <Text style={{fontSize:12, color:'#9CA3AF', fontWeight:'500'}}>({item.unit === 'Nos' ? 'Nos' : 'Box'})</Text></Text>"
);

code = code.replace(
    "<Text style={styles.itemName}>{item.name}</Text>",
    "<Text style={styles.itemName}>{item.name}</Text>" // wait we don't know the unit directly on the cartItem
);

fs.writeFileSync(path, code, 'utf8');
console.log('Updated home product list');
