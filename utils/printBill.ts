import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Asset } from 'expo-asset';
// import * as FileSystem from 'expo-file-system'; // REMOVED: Deprecated in newer SDKs
import { Bill } from '../redux/billSlice'; 

// Helper to convert number to words
const numberToWords = (num: number): string => {
  return `${num} (Only)`;
};

// NEW: Helper to safely convert local URI to Base64 using standard Fetch API
// This avoids the "FileSystem.readAsStringAsync" deprecation error.
const convertUriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string); // Returns 'data:image/png;base64,...'
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const printBill = async (bill: Bill) => {

  const products = bill.items.filter(item => item.type === 'product');
  const labour = bill.items.filter(item => item.type === 'labour');

  // --- LOCAL IMAGE LOADING LOGIC (UPDATED) ---
  // 1. Load the asset.
  const logoAsset = Asset.fromModule(require('../assets/company-logo.png'));
  
  // 2. Ensure the asset is downloaded/cached locally
  await logoAsset.downloadAsync();

  // 3. Convert to Base64 using the new helper
  // This replaces the deprecated FileSystem call
  let logoBase64 = "";
  if (logoAsset.localUri) {
     try {
       logoBase64 = await convertUriToBase64(logoAsset.localUri);
     } catch (e) {
       console.error("Failed to load logo", e);
       // Fallback to a placeholder if local load fails
       logoBase64 = "https://cdn-icons-png.flaticon.com/512/3202/3202926.png"; 
     }
  }

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 20px; }
          body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #000; }
          
          /* Main Container */
          .container { 
            border: 2px solid #000; 
            height: 98vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between;
            position: relative; 
            z-index: 1;
          }

          /* Watermark */
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            font-weight: 900;
            color: rgba(0, 0, 0, 0.10); 
            z-index: 9999; 
            text-align: center;
            line-height: 90px;
            white-space: nowrap;
            pointer-events: none;
          }
          
          /* --- Company Header Section --- */
          .company-header {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            border-bottom: 2px solid #000;
            background-color: transparent;
            position: relative;
          }
          
          .company-logo-img {
            width: 60px;
            height: 60px;
            margin-right: 20px;
            object-fit: contain;
          }

          .company-details {
            text-align: center;
          }

          .company-name {
            font-size: 28px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
            line-height: 1;
          }

          .company-tagline {
            font-size: 10px;
            margin-top: 5px;
            font-weight: bold;
            color: #444;
          }
          /* ----------------------------------- */

          /* Existing Sub-Header (Bill To / Bill No) */
          .header { 
            display: flex; 
            border-bottom: 2px solid #000; 
            flex-shrink: 0; 
            background-color: transparent; 
          }
          .header-left { flex: 1; padding: 10px; border-right: 1px solid #000; }
          .header-right { width: 300px; padding: 10px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          
          .table-container { 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
            background-color: transparent; 
          }
          
          table { 
            width: 100%; 
            height: 100%; 
            border-collapse: collapse; 
            table-layout: fixed; 
            background-color: transparent; 
          }
          
          th, td { border-right: 1px solid #000; padding: 5px; word-wrap: break-word; }
          th { border-bottom: 1px solid #000; background-color: rgba(240, 240, 240, 0.8); font-weight: bold; text-align: center; height: 30px; } 
          td { border-bottom: none; }
          
          .item-row { height: 1px; }
          
          .filler-row { height: 100%; }
          .filler-row td { vertical-align: top; }

          .col-sno { width: 40px; text-align: center; }
          .col-part { width: auto; text-align: left; }
          .col-qty { width: 60px; text-align: center; }
          .col-rate { width: 80px; text-align: right; }
          .col-amt { width: 90px; text-align: right; border-right: none; }

          .labour-header td { font-weight: bold; padding-top: 15px; text-decoration: underline; border-bottom: none; }
          .labour-header { height: 1px; }

          .footer-info { 
            flex-shrink: 0; 
            border-top: 2px solid #000; 
            border-bottom: 1px solid #000; 
            padding: 5px; 
            font-weight: bold; 
            display: flex; 
            justify-content: space-between; 
            background-color: white; 
          }
          
          .footer-bottom { 
            flex-shrink: 0; 
            display: flex; 
            height: 120px;
            background-color: white; 
          }
          .footer-left { flex: 1; padding: 10px; border-right: 1px solid #000; display: flex; flex-direction: column; justify-content: space-between; }
          .footer-right { width: 250px; display: flex; flex-direction: column; }
          
          .summary-row { display: flex; border-bottom: 1px solid #000; }
          .summary-label { flex: 1; padding: 5px; border-right: 1px solid #000; font-weight: bold; }
          .summary-val { width: 90px; padding: 5px; text-align: right; }
          .last-row { border-bottom: none; }
          
          .total-highlight { background-color: #e0e0e0; }

          .signatures { display: flex; justify-content: space-between; margin-top: 30px; align-items: flex-end; }
        </style>
      </head>
      <body>
        <div class="container">

          <div class="watermark">
            ISAII BILLSUITE<br>SAMPLE BILL
          </div>
          
          <!-- NEW: Logo and Company Name Header -->
          <div class="company-header">
            <!-- Logo Image -->
            <img src="${logoBase64}" class="company-logo-img" alt="Logo" />
            
            <!-- Company Text -->
            <div class="company-details">
              <div class="company-name">JK CAR SERVICE</div>
              <div class="company-tagline">Premium Auto Care & Service Center</div>
            </div>
          </div>

          <!-- Existing Info Header -->
          <div class="header">
            <div class="header-left">
              <div class="row"><strong>Bill To:</strong></div>
              <div style="margin-left: 20px;">
                <div class="title">${bill.customerName.toUpperCase()}</div>
                <div>Mob No: ${bill.customerPhone || 'N/A'}</div>
              </div>
            </div>
            <div class="header-right">
              <div class="row"><span>Bill No:</span> <strong>${bill.id}</strong></div>
              <div class="row"><span>Date:</span> <strong>${bill.date}</strong></div>
              <div class="row"><span>Vec No:</span> <strong>${bill.vehicleNumber || 'N/A'}</strong></div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="col-sno">S.No</th>
                  <th class="col-part">Particulars</th>
                  <th class="col-qty">Qty</th>
                  <th class="col-rate">Rate</th>
                  <th class="col-amt">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${products.map((item, index) => `
                  <tr class="item-row">
                    <td class="col-sno">${index + 1}</td>
                    <td class="col-part">${item.name}</td>
                    <td class="col-qty">${item.qty}</td>
                    <td class="col-rate">${item.rate.toFixed(2)}</td>
                    <td class="col-amt">${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}

                ${labour.length > 0 ? `
                  <tr class="labour-header">
                    <td class="col-sno"></td>
                    <td class="col-part">Labour Service Details</td>
                    <td class="col-qty"></td>
                    <td class="col-rate"></td>
                    <td class="col-amt"></td>
                  </tr>
                ` : ''}

                 ${labour.map((item, index) => `
                  <tr class="item-row">
                    <td class="col-sno">${products.length + index + 1}</td>
                    <td class="col-part">${item.name}</td>
                    <td class="col-qty">-</td>
                    <td class="col-rate">${item.rate.toFixed(2)}</td>
                    <td class="col-amt">${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}

                <tr class="filler-row">
                    <td class="col-sno"></td>
                    <td class="col-part"></td>
                    <td class="col-qty"></td>
                    <td class="col-rate"></td>
                    <td class="col-amt"></td>
                </tr>

              </tbody>
            </table>
          </div>

          <div class="footer-info">
            <span>Current KM: ${bill.currentKm || '0'}</span>
            <span>Next Service KM: ${bill.nextServiceKm || '0'}</span>
          </div>

          <div class="footer-bottom">
            <div class="footer-left">
              <div>
                <div><strong>Rupees:</strong> ${numberToWords(bill.grandTotal)}</div>
                <div style="margin-top: 5px;"><strong>Remarks:</strong> ${bill.remarks || '-'}</div>
              </div>
              
              <div class="signatures">
                <span>Verified By</span>
                <span>Welcome You All</span>
                <span>For Service Point</span>
              </div>
            </div>

            <div class="footer-right">
              <div class="summary-row total-highlight">
                <div class="summary-label">Total</div>
                <div class="summary-val">${bill.grandTotal.toFixed(2)}</div>
              </div>
              <div class="summary-row">
                <div class="summary-label">Bill Paid</div>
                <div class="summary-val">0.00</div>
              </div>
              <div class="summary-row">
                <div class="summary-label">Advance</div>
                <div class="summary-val">0.00</div>
              </div>
              <div class="summary-row last-row">
                <div class="summary-label">Balance</div>
                <div class="summary-val">${bill.grandTotal.toFixed(2)}</div>
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