const fs = require('fs');

let content = fs.readFileSync('utils/printBill.ts', 'utf8');
content = content.replace(/\r\n/g, '\n');

// Update imports
content = content.replace("import * as Print from 'expo-print';", "import * as Print from 'expo-print';\nimport { shareAsync } from 'expo-sharing';");

// Update function name
content = content.replace("export const printBill = async", "export const shareBill = async");

// Replace end logic
const oldEnd = `    const result = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', result?.uri);
    await Print.printAsync({ html, orientation: Print.Orientation.portrait });
};`;

const newEnd = `    const result = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', result?.uri);
    if (result && result.uri) {
        await shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
};`;

if (content.includes(oldEnd)) {
    content = content.replace(oldEnd, newEnd);
    fs.writeFileSync('utils/shareBill.ts', content, 'utf8');
    console.log('Successfully rebuilt shareBill.ts');
} else {
    console.log('Could not find oldEnd string in printBill.ts');
}
