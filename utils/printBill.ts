import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Alert } from 'react-native';
import { Bill } from '../redux/billSlice';

export const printBill = async (bill: Bill) => {
    // Treat all items as products since there's no labour anymore
    const allItems = bill.items || [];

    // Calculate items per page (leaving room for header, footer, etc.)
    const ITEMS_PER_PAGE = 20;
    const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE) || 1;

    const logoAsset = Asset.fromModule(require('../assets/logo.png'));
    const watermarkAsset = Asset.fromModule(require('../assets/watermark.png'));
    await Promise.all([logoAsset.downloadAsync(), watermarkAsset.downloadAsync()]);

    let logoBase64 = "";
    let watermarkBase64 = "";

    try {
        if (logoAsset.localUri) {
            // Read directly or create unique temp file
            const tempLogoPath = FileSystem.cacheDirectory + 'temp_logo_' + Date.now() + '.png';
            await FileSystem.copyAsync({ from: logoAsset.localUri, to: tempLogoPath });
            const base64 = await FileSystem.readAsStringAsync(tempLogoPath, { encoding: FileSystem.EncodingType.Base64 });
            logoBase64 = `data:image/png;base64,${base64}`;
        }
        if (watermarkAsset.localUri) {
            const tempWatermarkPath = FileSystem.cacheDirectory + 'temp_watermark_' + Date.now() + '.png';
            await FileSystem.copyAsync({ from: watermarkAsset.localUri, to: tempWatermarkPath });
            const base64 = await FileSystem.readAsStringAsync(tempWatermarkPath, { encoding: FileSystem.EncodingType.Base64 });
            watermarkBase64 = `data:image/png;base64,${base64}`;
        }
    } catch (e: any) {
        console.error("Failed to load images", e);
    }

    const generateHeader = (pageNum: number, totalPages: number) => `
    <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
            
            <!-- LEFT: Company Details -->
            <div style="width: 33%; font-size: 11px; line-height: 1.4; color: #164f79;">
                <strong>Lic No : A/E/SC/TN/22/929 (E88325)</strong><br><br>
                <strong>V.P. SENTHILKUMAR</strong><br>
                1/154, Somanur Road,<br>63.Velampalayam, Palladam - 641 663<br>
                &#9742; 99762 18700<br>
                sscoexplosives2016@gmail.com
            </div>
            
            <!-- CENTER: Logo & Name -->
            <div style="width: 34%; text-align: center; display: flex; flex-direction: column; align-items: center;">
                <div class="rhombus-container" style="margin-bottom: 8px;">
                    <img src="${logoBase64}" class="header-logo" />
                </div>
                <h1 class="company-name" style="font-size: 20px; text-shadow: 1px 1px 0px #fff, 1px 1px 2px rgba(0,0,0,0.2);">S.S. & CO EXPLOSIVES</h1>
            </div>

            <!-- RIGHT: Invoice & Customer -->
            <div style="width: 33%; font-size: 12px; line-height: 1.4; color: #164f79; text-align: right;">
                <div><strong>Invoice No:</strong> ${bill.id}</div>
                <div><strong>Date:</strong> ${new Date(bill.date).toLocaleDateString('en-GB')}</div>
                <div style="margin-top: 15px;">
                    <strong style="font-size: 11px;">Billed To:</strong><br>
                    <span style="font-size: 14px; font-weight: bold; color: #000;">${bill.customerName}</span><br>
                    ${bill.customerPhone || ''}
                </div>
            </div>

        </div>
        <div class="divider" style="margin: 10px 0;"></div>
    </div>`;

    const pages = [];
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIdx = pageIndex * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, allItems.length);
        const pageItems = allItems.slice(startIdx, endIdx);
        const isLastPage = pageIndex === totalPages - 1;

        const pageHTML = `
<div class="page-container ${!isLastPage ? 'page-break' : ''}">
    <img src="${watermarkBase64}" class="watermark-logo">
    ${generateHeader(pageIndex + 1, totalPages)}

    <div class="items-area">
        <div class="grid header-row">
            <div class="cell center">S.No</div>
            <div class="cell">Particulars</div>
            <div class="cell center">Qty</div>
            <div class="cell right">Rate</div>
            <div class="cell right">Amount</div>
        </div>

        ${pageItems.map((item, i) => `
        <div class="grid row">
            <div class="cell center">${startIdx + i + 1}</div>
            <div class="cell">${item.name}</div>
            <div class="cell center">${item.qty}</div>
            <div class="cell right">${item.rate}</div>
            <div class="cell right">${item.amount}</div>
        </div>
        `).join('')}

        <div class="filler">
            <div></div><div></div><div></div><div></div><div></div>
        </div>
    </div>

    ${isLastPage ? `
    <div class="footer">
        <div class="remarks">
            <strong>Remarks:</strong><br>
            ${bill.remarks || ''}
        </div>

        <div class="totals">
            <div class="total-row grand">
                <span>Total</span>
                <span>${(bill.subtotal || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>Advance Paid</span>
                <span>${(bill.advancePayment || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>Balance Due</span>
                <span>${(bill.pendingAmount ?? Math.max(0, bill.grandTotal - (bill.advancePayment || 0))).toFixed(2)}</span>
            </div>
        </div>
    </div>
    
    <div class="footer-bottom">
        <div class="footer-divider"></div>
        Magazine Address : S.F. No : 6/1, Sukkampalayam Village, Palladam (Tk), Tirupur.
    </div>
    ` : ''}
</div>`;

        pages.push(pageHTML);
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
@page { margin: 20px 15px; }
* { box-sizing: border-box; }

body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
}

.page-container {
    border: 2px solid #000;
    min-height: 90vh; /* Reduced to prevent overflow to a second page */
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
    padding: 15px;
    box-sizing: border-box;
    page-break-inside: avoid;
}

.watermark-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    opacity: 0.35;
    z-index: -1;
    pointer-events: none;
}

.page-break { page-break-after: always; }

/* HEADER */
.header { margin-bottom: 15px; }
.top-row {
    display: flex; justify-content: space-between;
    font-size: 13px; font-weight: bold; color: #164f79;
    margin-bottom: 10px;
}
.title-row {
    display: flex; align-items: center; justify-content: center;
    width: 100%; gap: 20px;
}
.rhombus-container {
    width: 65px;
    height: 65px;
    transform: rotate(45deg);
    background-color: #000;
    overflow: hidden;
    position: relative;
    border-radius: 4px;
    flex-shrink: 0;
}
.header-logo { 
    width: 95px; 
    height: 95px;
    transform: rotate(-45deg);
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -47.5px;
    margin-left: -47.5px;
    object-fit: cover;
}
.company-name {
    color: #7b293b; font-family: 'Times New Roman', serif;
    font-size: 32px; margin: 0;
    text-shadow: 1px 1px 0px #fff, 2px 2px 2px rgba(0,0,0,0.3);
}
.company-address {
    font-size: 14px; color: #164f79; margin-top: 5px;
    font-weight: bold; text-align: center;
}
.divider {
    border-top: 2px solid #7b293b; border-bottom: 1px solid #7b293b;
    height: 2px; margin: 15px 0;
}
.info-container {
    display: flex; justify-content: space-between;
    font-size: 14px; margin-bottom: 10px; color: #164f79;
}

/* GRID AREA */
.items-area { flex: 1; display: flex; flex-direction: column; }
.grid { display: grid; grid-template-columns: 45px 1fr 70px 90px 110px; }
.grid.header-row { font-weight: bold; border: 2px solid #000; background: #f2f2f2; }
.cell { padding: 8px; border-right: 1px solid #000; border-bottom: 1px solid #000; }
.cell:last-child { border-right: none; }
.center { text-align: center; }
.right  { text-align: right; padding-right: 8px; }
.row { border-left: 2px solid #000; border-right: 2px solid #000; }

.filler {
    flex: 1; display: grid; grid-template-columns: 45px 1fr 70px 90px 110px;
    border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 2px solid #000;
}
.filler div { border-right: 1px solid #000; }
.filler div:last-child { border-right: none; }

/* FOOTER */
.footer {
    display: flex; min-height: 120px;
    border: 2px solid #000; border-top: none;
    margin-bottom: 10px;
}
.remarks { flex: 1; border-right: 2px solid #000; padding: 10px; }
.totals { width: 45%; display: flex; flex-direction: column; }
.total-row {
    display: flex; justify-content: space-between;
    padding: 8px 10px; border-bottom: 1px solid #000; font-weight: bold;
}
.total-row:last-child { border-bottom: none; }
.total-row.grand { background: #eee; border-bottom: 2px solid #000; }
.footer-bottom {
    text-align: center; font-size: 13px; font-weight: bold; color: #164f79;
    margin-top: 10px;
}
.footer-divider {
    border-top: 2px solid #164f79; border-bottom: 1px solid #164f79;
    height: 2px; margin-bottom: 8px;
}
</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`;

    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);
    await Print.printAsync({ html, orientation: Print.Orientation.portrait });
};
