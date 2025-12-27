import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Alert } from 'react-native';
import { Bill } from '../redux/billSlice';


const numberToWords = (num: number): string => {
    return `${num} (Only)`;
};



export const printBill = async (bill: Bill) => {


    const products = bill.items.filter(item => item.type === 'product');
    const labour = bill.items.filter(item => item.type === 'labour');

    // Combine all items for pagination
    const allItems = [...products, ...labour];

    // Calculate items per page (leaving room for header, footer, etc.)
    const ITEMS_PER_PAGE = 23;
    const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

    const logoAsset = Asset.fromModule(require('../assets/company-logo.png'));
    await logoAsset.downloadAsync();

    // Load God Image
    const godAsset = Asset.fromModule(require('../assets/god-image.png'));
    await godAsset.downloadAsync();

    let logoBase64 = "";

    if (logoAsset.localUri) {
        try {
            // Robust method: Copy to cache first to avoid access issues in production
            const targetPath = FileSystem.cacheDirectory + 'logo_copy.png';
            await FileSystem.copyAsync({
                from: logoAsset.localUri,
                to: targetPath
            });

            const base64 = await FileSystem.readAsStringAsync(targetPath, {
                encoding: FileSystem.EncodingType.Base64,
            });
            logoBase64 = `data:image/png;base64,${base64}`;
        }
        catch (e: any) {
            console.error("Failed to load logo", e);
            Alert.alert("Logo Load Error", e.message || JSON.stringify(e));
            logoBase64 = "https://cdn-icons-png.flaticon.com/512/741/741407.png";
        }
    }

    let godBase64 = "";
    if (godAsset.localUri) {
        try {
            const targetPath = FileSystem.cacheDirectory + 'god_copy.png';
            await FileSystem.copyAsync({
                from: godAsset.localUri,
                to: targetPath
            });

            const base64 = await FileSystem.readAsStringAsync(targetPath, {
                encoding: FileSystem.EncodingType.Base64,
            });
            godBase64 = `data:image/png;base64,${base64}`;
        } catch (e: any) {
            console.error("Failed to load god image", e);
            godBase64 = "";
        }
    }

    // Generate header HTML (reusable for each page)
    const generateHeader = (pageNum: number, totalPages: number) => `
    <div class="header">
        <div class="header-left">
            <img src="${logoBase64}" class="logo">
            <div style="margin-left: 20px; font-size: 18px; margin-right: 20px;">
                <div class="company-name">JK CAR SERVICE & DECORS</div>
                <div>Indhra Nagar, Konavaikkal</div>
                <div>Bhavani, Tamil Nadu 638316</div>
                <div><strong>Phone1: 96981 92330</strong></div>
                <div><strong>Phone2: 99721 68980</strong></div>
            </div>
    
            <img src="${godBase64}" class="god-img">
        </div>

        <div class="header-right">
            <div>
                <div class="info-row"><span class="info-label">Bill To:</span>${bill.customerName}</div>
                <div class="info-row"><span class="info-label">Phone:</span>${bill.customerPhone}</div>
                <div class="info-row"><span class="info-label">Bill No:</span>${bill.id}</div>
                <div class="info-row"><span class="info-label">Date:</span>${bill.date}</div>
                <div class="info-row"><span class="info-label">Vehicle:</span>${bill.vehicleName}</div>
                <div class="info-row"><span class="info-label">Vehicle No:</span>${bill.vehicleNumber}</div>
            </div>
            
        </div>
    </div>

    <div class="km-strip">
        <span>Current KM: ${bill.currentKm}</span>
        <span>Next Service KM: ${bill.nextServiceKm}</span>
        <span style="font-size: 10px; color: #666;">Page ${pageNum} of ${totalPages}</span>
    </div>`;

    // Generate pages
    const pages = [];
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIdx = pageIndex * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, allItems.length);
        const pageItems = allItems.slice(startIdx, endIdx);
        const isLastPage = pageIndex === totalPages - 1;

        const pageHTML = `
<div class="page-container ${!isLastPage ? 'page-break' : ''}">
    ${generateHeader(pageIndex + 1, totalPages)}

    <div class="items-area">
        <div class="grid header-row">
            <div class="cell center">S.No</div>
            <div class="cell">Particulars</div>
            <div class="cell center">Qty</div>
            <div class="cell right">Rate</div>
            <div class="cell right">Amount</div>
        </div>

        ${pageItems.map((item, i) => {
            const isFirstLabour = item.type === 'labour' && (i === 0 || pageItems[i - 1].type !== 'labour');
            const isFirstProduct = item.type === 'product' && (i === 0 || pageItems[i - 1].type !== 'product');

            return `
        ${isFirstLabour ? `
        <div class="grid row section-header-row">
            <div class="cell center"></div>
            <div class="cell" style="font-weight: bold; font-size: 14px;">Labour Charges:</div>
            <div class="cell center"></div>
            <div class="cell right"></div>
            <div class="cell right"></div>
        </div>
        ` : ''}
        <div class="grid row ${item.type === 'labour' ? 'labour-row' : ''}">
            <div class="cell center">${startIdx + i + 1}</div>
            <div class="cell">${item.name}</div>
            <div class="cell center">${item.qty}</div>
            <div class="cell right">${item.rate}</div>
            <div class="cell right">${item.amount}</div>
        </div>
        `;
        }).join('')}

        ${!isLastPage ? `
        <div class="filler">
            <div></div><div></div><div></div><div></div><div></div>
        </div>
        ` : `
        <div class="filler">
            <div></div><div></div><div></div><div></div><div></div>
        </div>
        `}
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
                <span>${bill.subtotal.toFixed(2)}</span>
            </div>

            <div class="total-row">
                <span>Advance Paid</span>
                <span>${(bill.advancePayment || 0).toFixed(2)}</span>
            </div>

            <div class="total-row">
                <span>Balance</span>
                <span>${(bill.grandTotal)}</span>
            </div>

            <div class="signature">
                <div style="padding-top:30px;">
                    Authorized Signature
                </div>
            </div>
        </div>
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
@page { margin: 30px 15px 1px 15px; }
* { box-sizing: border-box; }

body {
    margin: 15px 15px 1px 15px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 15px;
}

.page-container {
    border: 2px solid #000;
    min-height: calc(95vh - 10px);
    display: flex;
    flex-direction: column;
}

.page-break {
    page-break-after: always;
}

/* ================= HEADER ================= */

.header {
    display: flex;
    border-bottom: 2px solid #000;
}

.header-left {
    width: 70%;
    border-right: 2px solid #000;
    padding: 10px;
    display: flex;
    gap: 20px;
    align-items: center;
    position: relative; /* Added for absolute positioning of children */
}

.logo {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 1px solid #aaa;
    object-fit: cover;
}

.company-name {
    color: #2fd715;
    font-weight: 900;
    font-size: 22px;
    white-space: nowrap;
}

.header-right {
    width: 30%;
    padding: 6px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

.info-row {
    display: flex;
    margin-bottom: 4px;
}

.info-label {
    width: 80px;
    font-weight: bold;
}

.god-img {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 1px solid #aaa;
    object-fit: cover;
    position: absolute;
    right: 10px;
    top: 25px;
    z-index: -1;
}

/* ================= KM STRIP ================= */

.km-strip {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    border-bottom: 2px solid #000;
    font-weight: bold;
}

/* ================= GRID AREA ================= */

.items-area {
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* COLUMN GRID */
.grid {
    display: grid;
    grid-template-columns: 45px 1fr 70px 90px 110px;
}

/* HEADER ROW */
.grid.header-row {
    font-weight: bold;
    border-bottom: 2px solid #000;
}

.cell {
    padding: 6px;
    border-right: 2px solid #000;
}

.cell:last-child {
    border-right: none;
}

.center { text-align: center; }
.right  { text-align: right; padding-right: 8px; }

/* ITEM ROWS */
.row {
    border-bottom: none;
}

.labour-row {
    font-size: 14px;
    font-weight: normal;
}

/* EMPTY FILLER (THIS IS THE KEY PART) */
.filler {
    flex: 1;
    display: grid;
    grid-template-columns: 45px 1fr 70px 90px 110px;
}

.filler div {
    border-right: 2px solid #000;
}

.filler div:last-child {
    border-right: none;
}

/* ================= FOOTER ================= */

.footer {
    display: flex;
    border-top: 2px solid #000;
    min-height: 130px;
}

.remarks {
    flex: 1;
    border-right: 2px solid #000;
    padding: 8px;
}

.totals {
    width: 40%;
    display: flex;
    flex-direction: column;
}

.total-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    border-bottom: 1px solid #000;
    font-weight: bold;
}

.total-row.grand {
    background: #eee;
    border-bottom: 2px solid #000;
}

.signature {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 10px;
    font-style: italic;
}
</style>
</head>

<body>
${pages.join('\n')}
</body>
</html>
`;

    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);

    await Print.printAsync({
        html: html,
        orientation: Print.Orientation.portrait,
    });
};
