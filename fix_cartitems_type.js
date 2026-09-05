const fs = require('fs');
let code = fs.readFileSync('app/(drawer)/home/index.tsx', 'utf8');

code = code.replace(
    `const [cartItems, setCartItems] = useState<{
    id: string;
    name: string;
    qty: number;
    rate: number;
    amount: number;
    type: 'product' | 'labour'
  }[]>([]);`,
    `const [cartItems, setCartItems] = useState<{
    id: string;
    name: string;
    qty: number;
    rate: number;
    amount: number;
    type: 'product' | 'labour';
    unit?: 'Box' | 'Nos';
  }[]>([]);`
);

fs.writeFileSync('app/(drawer)/home/index.tsx', code, 'utf8');
console.log('Fixed cartItems type in home');
