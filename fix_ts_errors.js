const fs = require('fs');

// 1. Fix redux/billSlice.ts
let path1 = 'redux/billSlice.ts';
let code1 = fs.readFileSync(path1, 'utf8');

if (!code1.includes("unit?: 'Box' | 'Nos';")) {
    code1 = code1.replace(
        /export interface StockLedger \{[\s\S]*?referenceId\?: string; \/\/ e\.g\. Bill ID\r?\n\}/,
        "export interface StockLedger {\n  id: string;\n  date: string;\n  type: 'IN' | 'OUT';\n  qty: number;\n  remarks: string;\n  referenceId?: string; // e.g. Bill ID\n  unit?: 'Box' | 'Nos';\n}"
    );

    code1 = code1.replace(
        /export interface Product \{[\s\S]*?price: string;\r?\n\}/,
        "export interface Product {\n  id: string;\n  name: string;\n  price: string;\n  unit?: 'Box' | 'Nos';\n}"
    );
    
    // Also update parsers if needed
    code1 = code1.replace(
        /referenceId: s\.referenceId \? String\(s\.referenceId\) : ''\r?\n\s*\}\)\) as StockLedger\[\];/,
        "referenceId: s.referenceId ? String(s.referenceId) : '',\n          unit: s.unit === 'Nos' ? 'Nos' : 'Box'\n        })) as StockLedger[];"
    );
    
    code1 = code1.replace(
        /price: String\(p\.price\)\r?\n\s*\}\)\) as Product\[\];/,
        "price: String(p.price),\n          unit: p.unit === 'Nos' ? 'Nos' : 'Box'\n        })) as Product[];"
    );

    fs.writeFileSync(path1, code1, 'utf8');
    console.log('Fixed billSlice interfaces and parsers');
}

// 2. Fix app/(drawer)/home/index.tsx
let path2 = 'app/(drawer)/home/index.tsx';
let code2 = fs.readFileSync(path2, 'utf8');
if (code2.includes('products.find')) {
    code2 = code2.replace(/products\.find/g, 'availableProducts.find');
    fs.writeFileSync(path2, code2, 'utf8');
    console.log('Fixed availableProducts references in home');
}

// 3. Fix app/(drawer)/history/[id].tsx which might have the same 'products' issue!
let path3 = 'app/(drawer)/history/[id].tsx';
let code3 = fs.readFileSync(path3, 'utf8');
// In history details, I injected: const { bills, products } = useSelector... so 'products' is correctly destructured there!
// Wait, I did `code = code.replace('const { bills } = useSelector', 'const { bills, products } = useSelector');`
// If it worked, products is defined. If it failed, it might be an issue. Let's make sure.
if (code3.includes('products?.find(')) {
    if (!code3.includes('products } = useSelector')) {
        // if not destructured properly, let's fix it
        code3 = code3.replace(
            /const \{ bills \} = useSelector\(\(state: RootState\) => state\.billing\);/,
            "const { bills, products } = useSelector((state: RootState) => state.billing);"
        );
        fs.writeFileSync(path3, code3, 'utf8');
        console.log('Fixed products destructuring in history details');
    }
}
