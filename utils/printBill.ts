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


    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
@page { margin: 15px; }
* { box-sizing: border-box; }

body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
}

.container {
    border: 2px solid #000;
    min-height: 98vh;
    display: flex;
    flex-direction: column;
}

/* ================= HEADER ================= */

.header {
    display: flex;
    border-bottom: 2px solid #000;
}

.header-left {
    width: 55%;
    border-right: 2px solid #000;
    padding: 12px;
    display: flex;
    gap: 12px;
}

.logo {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: 1px solid #aaa;
}

.company-name {
    color: #2fd715;
    font-weight: 900;
    font-size: 18px;
}

.header-right {
    width: 45%;
    padding: 12px;
    display: flex;
    justify-content: space-between;
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
    width: 70px;
    height: 70px;
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

<div class="container">

    <!-- HEADER -->
    <div class="header">
        <div class="header-left">
            <img src="${logoBase64}" class="logo">
            <div>
                <div class="company-name">JK SERVICE & DECORS</div>
                <div>Indhra Nagar, Konavaikkal</div>
                <div>Bhavani, Tamil Nadu 638316</div>
                <div><strong>Phone: 96981 92330</strong></div>
            </div>
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
            <img src="${godBase64}" class="god-img">
        </div>
    </div>

    <!-- KM -->
    <div class="km-strip">
        <span>Current KM: ${bill.currentKm}</span>
        <span>Next Service KM: ${bill.nextServiceKm}</span>
    </div>

    <!-- ITEMS -->
    <div class="items-area">

        <!-- HEADER -->
        <div class="grid header-row">
            <div class="cell center">S.No</div>
            <div class="cell">Particulars</div>
            <div class="cell center">Qty</div>
            <div class="cell right">Rate</div>
            <div class="cell right">Amount</div>
        </div>

        <!-- ROWS -->
        ${products.map((p, i) => `
        <div class="grid row">
            <div class="cell center">${i + 1}</div>
            <div class="cell">${p.name}</div>
            <div class="cell center">${p.qty}</div>
            <div class="cell right">${p.rate}</div>
            <div class="cell right">${p.amount}</div>
        </div>
        `).join('')}

        <!-- FILLER TO FORCE FULL HEIGHT LINES -->
        <div class="filler">
            <div></div><div></div><div></div><div></div><div></div>
        </div>

    </div>

    <!-- FOOTER -->
    <div class="footer">
        <div class="remarks">
            <strong>Remarks:</strong><br>
            ${bill.remarks || ''}
        </div>

        <div class="totals">
            <div class="total-row grand">
                <span>Total</span>
                <span>${bill.grandTotal.toFixed(2)}</span>
            </div>

            <div class="total-row">
                <span>Advance Paid</span>
                <span>${(bill.advancePayment || 0).toFixed(2)}</span>
            </div>

            <div class="total-row">
                <span>Balance</span>
                <span>${(bill.grandTotal - (bill.advancePayment || 0)).toFixed(2)}</span>
            </div>

            <div class="signature">
                <div style="border-top:1px solid #000; padding:5px 25px;">
                    Authorized Signature
                </div>
            </div>
        </div>
    </div>

</div>

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