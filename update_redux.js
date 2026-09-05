const fs = require('fs');

const path = 'redux/billSlice.ts';
let code = fs.readFileSync(path, 'utf8');

// Update Product interface
code = code.replace(
`export interface Product {
  id: string;
  name: string;
  price: string;
}`,
`export interface Product {
  id: string;
  name: string;
  price: string;
  unit?: 'Box' | 'Nos';
}`
);

// Update StockLedger interface
code = code.replace(
`export interface StockLedger {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  qty: number;
  remarks: string;
  referenceId?: string; // e.g. Bill ID
}`,
`export interface StockLedger {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  qty: number;
  remarks: string;
  referenceId?: string; // e.g. Bill ID
  unit?: 'Box' | 'Nos';
}`
);

// Update fetchStockLedgerFromGoogleSheets parser
code = code.replace(
`          remarks: String(s.remarks || ''),
          referenceId: s.referenceId ? String(s.referenceId) : ''
        })) as StockLedger[];`,
`          remarks: String(s.remarks || ''),
          referenceId: s.referenceId ? String(s.referenceId) : '',
          unit: s.unit === 'Nos' ? 'Nos' : 'Box'
        })) as StockLedger[];`
);

// Update fetchProductsFromGoogleSheets parser
code = code.replace(
`          id: String(p.id),
          name: String(p.name),
          price: String(p.price)
        })) as Product[];`,
`          id: String(p.id),
          name: String(p.name),
          price: String(p.price),
          unit: p.unit === 'Nos' ? 'Nos' : 'Box'
        })) as Product[];`
);

fs.writeFileSync(path, code, 'utf8');
console.log('Updated Redux interfaces and parsers');
