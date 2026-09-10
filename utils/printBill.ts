import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Alert, Platform } from 'react-native';
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
        if (Platform.OS === 'web') {
            logoBase64 = logoAsset.uri || '';
            watermarkBase64 = watermarkAsset.uri || '';
        } else {
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
        }
    } catch (e: any) {
        console.error("Failed to load images", e);
    }

    const generateHeader = (pageNum: number, totalPages: number) => `
    <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
            
            <!-- LEFT: Company Details -->
            <div style="width: 33%; font-size: 11px; line-height: 1.5; color: #164f79;">
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
                <div><strong>Date:</strong> ${isNaN(new Date(bill.date).getTime()) ? bill.date : new Date(bill.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
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
            <div class="cell center">Qty / Unit</div>
            <div class="cell right">Rate</div>
            <div class="cell right">Amount</div>
        </div>

        ${pageItems.map((item, i) => `
        <div class="grid row">
            <div class="cell center">${startIdx + i + 1}</div>
            <div class="cell">${item.name}</div>
            <div class="cell center">${item.qty} ${item.unit === 'Nos' ? 'Nos' : 'Box'}</div>
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
    opacity: 0.12;
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
.grid { display: grid; grid-template-columns: 45px 1fr 100px 90px 110px; }
.grid.header-row { font-weight: bold; border: 2px solid #000; background: #f2f2f2; }
.cell { padding: 8px; border-right: 1px solid #000; border-bottom: 1px solid #000; }
.cell:last-child { border-right: none; }
.center { text-align: center; }
.right  { text-align: right; padding-right: 8px; }
.row { border-left: 2px solid #000; border-right: 2px solid #000; }

.filler {
    flex: 1; display: grid; grid-template-columns: 45px 1fr 100px 90px 110px;
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

    if (Platform.OS === 'web') {
        // Expo Print doesn't support custom HTML on web, it just prints the main window.
        // So we manually create an iframe to print the invoice HTML!
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.contentDocument?.write(html);
        iframe.contentDocument?.close();
        
        // Wait for images to load before printing
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
        
        return;
    }

    const result = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', result?.uri);
    await Print.printAsync({ html, orientation: Print.Orientation.portrait });
};
