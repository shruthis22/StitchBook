const fs = require('fs');

function fixComma(path) {
    let code = fs.readFileSync(path, 'utf8');
    
    // add/index.tsx has multi-line emptyText
    // add-stock/index.tsx has single-line emptyText
    // Just find "methodBtn: {" and replace the preceding brace if it lacks a comma.
    
    code = code.replace(/\}\s*methodBtn: \{/, '},\n\n  methodBtn: {');
    
    fs.writeFileSync(path, code, 'utf8');
    console.log('Fixed comma in', path);
}

fixComma('app/(drawer)/add/index.tsx');
fixComma('app/(drawer)/add-stock/index.tsx');
