const fs = require('fs');

const formatFile = (path) => {
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');

    // Regex to match any .toFixed(0) or .toFixed(2) that we missed
    code = code.replace(/\.toFixed\([02]\)/g, ".toLocaleString('en-IN')");
    
    fs.writeFileSync(path, code, 'utf8');
    console.log('Formatted thoroughly', path);
};

formatFile('app/(drawer)/history/index.tsx');
formatFile('app/(drawer)/history/[id].tsx');
formatFile('app/(drawer)/pending-payments/index.tsx');
formatFile('app/(drawer)/dashboard/index.tsx');
