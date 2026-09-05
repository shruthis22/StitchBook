const fs = require('fs');

let content = fs.readFileSync('utils/printBill.ts', 'utf8');

const oldBlock = `<div style="width: 33%; font-size: 11px; line-height: 1.4; color: #164f79;">
                <strong>Lic No : A/E/SC/TN/22/929 (E88325)</strong><br><br>
                <strong>V.P. SENTHILKUMAR</strong><br>
                &#128205; 1/154, Somanur Road,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;63.Velampalayam, Palladam - 641 663<br>
                &#9742; 99762 18700<br>
                &#9993; sscoexplosives2016@gmail.com
            </div>`;

const newBlock = `<div style="width: 33%; font-size: 11px; line-height: 1.5; color: #164f79;">
                <strong>Lic No : A/E/SC/TN/22/929 (E88325)</strong><br><br>
                <strong>V.P. SENTHILKUMAR</strong>
                <div style="display: flex; align-items: flex-start; margin-top: 6px;">
                    <span style="margin-right: 6px; margin-top: 1px;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </span>
                    <span>1/154, Somanur Road,<br>63.Velampalayam, Palladam - 641 663</span>
                </div>
                <div style="display: flex; align-items: center; margin-top: 4px;">
                    <span style="margin-right: 6px;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </span>
                    <span>99762 18700</span>
                </div>
                <div style="display: flex; align-items: center; margin-top: 4px;">
                    <span style="margin-right: 6px;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </span>
                    <span>sscoexplosives2016@gmail.com</span>
                </div>
            </div>`;

// use regex or normal replace, let's normalize spaces
const normalize = str => str.replace(/\s+/g, ' ').trim();

let startIdx = -1;
let endIdx = -1;
const contentNorm = normalize(content);
const oldNorm = normalize(oldBlock);

if (contentNorm.includes(oldNorm)) {
    // we can just regex replace because we can find it
    // Actually, it's easier to just find the indices roughly
    const startStr = '<div style="width: 33%; font-size: 11px; line-height: 1.4; color: #164f79;">';
    const endStr = 'sscoexplosives2016@gmail.com\r\n            </div>';
    const endStr2 = 'sscoexplosives2016@gmail.com\n            </div>';
    
    let s = content.indexOf(startStr);
    let e = content.indexOf(endStr);
    if (e === -1) e = content.indexOf(endStr2);
    
    if (s !== -1 && e !== -1) {
        let actualOld = content.substring(s, e + (e === content.indexOf(endStr) ? endStr.length : endStr2.length));
        content = content.replace(actualOld, newBlock);
        fs.writeFileSync('utils/printBill.ts', content, 'utf8');
        console.log('Replaced correctly');
    } else {
        console.log('Strings not found', s, e);
    }
}
