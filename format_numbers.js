const fs = require('fs');

const formatFile = (path) => {
    if (!fs.existsSync(path)) return;
    let code = fs.readFileSync(path, 'utf8');

    // Regex to match {someVar.toFixed(0)} or {someVar.toFixed(2)} and replace with {someVar.toLocaleString('en-IN')}
    code = code.replace(/\{([a-zA-Z0-9_]+)\.toFixed\([02]\)\}/g, '{$1.toLocaleString(\'en-IN\')}');
    
    // Also replace direct Number(someVar).toFixed(2) in strings or JSX
    code = code.replace(/Number\(([^)]+)\)\.toFixed\([02]\)/g, 'Number($1).toLocaleString(\'en-IN\')');

    // What if there is `item.amount` being rendered directly? Let's check manually later.
    
    fs.writeFileSync(path, code, 'utf8');
    console.log('Formatted', path);
};

formatFile('app/(drawer)/dashboard/index.tsx');
formatFile('app/(drawer)/history/index.tsx');
formatFile('app/(drawer)/history/[id].tsx');
formatFile('app/(drawer)/pending-payments/index.tsx');
