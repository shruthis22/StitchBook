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


  const html = `
    <html>
      <head>

        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />

        <style>
          @page { margin: 15px; }
          * { box-sizing: border-box; }
          body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #000; margin: 0; padding: 0; }
          
          /* Main Container */
          .container { 
            border: 2px solid #000; 
            min-height: 98vh;
            display: flex;
            flex-direction: column;
            position: relative;
          }

          /* --- Header Section --- */
          .header-section {
            display: flex;
            border-bottom: 2px solid #000;
            height: 180px; 
            flex-shrink: 0;
          }

          /* Left Header */
          .header-left {
            width: 50%;
            border-right: 2px solid #000;
            padding: 10px;
            display: flex;
            flex-direction: row;
            align-items: center;
          }

          .logo-container {
            width: 80px;
            text-align: center;
            margin-right: 10px;
          }
          .logo-img {
            width: 70px;
            height: 70px;
            object-fit: contain;
            border-radius: 50%;
            border: 1px solid #ccc;
          }

          .company-info {
            flex: 1;
            font-size: 11px;
            line-height: 1.4;
          }
          .company-name {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 5px;
            color: #2fd715ff;
          }

          /* Right Header */
          .header-right {
            width: 50%;
            padding: 15px;
            display: flex;
            flex-direction: row; /* Side-by-side */
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            line-height: 1.6;
          }
          
          .bill-info-container {
             flex: 1;
             display: flex;
             flex-direction: column;
             justify-content: center;
          }

          .god-img-container {
            width: 170px; 
            text-align: center;
            margin-left: 10px;
          }
          .god-img {
             width: 160px; 
             height: 160px;
             object-fit: contain;
          }

          .info-row {
            display: flex;
          }
          .info-label {
            width: 100px;
            font-weight: bold;
          }
          .info-val {
            font-weight: 500;
          }

          /* --- Mileage Strip --- */
          .mileage-strip {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #000;
            padding: 5px 15px;
            font-weight: bold;
            background-color: #f9f9f9;
            font-size: 13px;
            flex-shrink: 0;
          }

          /* --- Table Section --- */
          .table-container { 
            flex: 1;
            width: 100%;
            display: block;
            /* Vertical Lines Gradient - Consistent 2px width */
            background: linear-gradient(to right, 
              transparent 48px, #000 48px, #000 50px, transparent 50px,
              transparent calc(100% - 242px), #000 calc(100% - 242px), #000 calc(100% - 240px), transparent calc(100% - 240px),
              transparent calc(100% - 182px), #000 calc(100% - 182px), #000 calc(100% - 180px), transparent calc(100% - 180px),
              transparent calc(100% - 102px), #000 calc(100% - 102px), #000 calc(100% - 100px), transparent calc(100% - 100px)
            );
          }
          
          table { 
            width: 100%; 
            table-layout: fixed; 
            border-collapse: collapse; /* Ensure borders touch */
            border-spacing: 0; 
          }
          
          th { 
            border-bottom: 2px solid #000; 
            border-right: 2px solid #000;
            padding: 8px; 
            text-align: center;
            font-weight: bold;
            background-color: #eee;
            height: 30px; 
          }
          th:last-child { border-right: none; }

          thead { display: table-header-group; }

          tbody tr {
            height: auto; 
            page-break-inside: avoid; 
          }
          
          td { 
            border-bottom: none;
            border-right: none;
            padding: 5px 8px;
            vertical-align: top;
            background: transparent;
          }

          /* Force specific border on S.No column to be SURE it is visible */
          .col-sno { 
             width: 50px; 
             text-align: center; 
             /* Removed duplicate border to rely on gradient */
          }
          .col-part { text-align: left; }
          .col-qty { width: 60px; text-align: center; }
          .col-rate { width: 80px; text-align: right; }
          .col-amt { width: 100px; text-align: right; }

           .labour-header td {
              font-weight: bold;
              text-decoration: underline;
              padding-top: 10px;
              height: auto; 
              border-right: none;
              border-bottom: none;
           }

          /* --- Footer Section --- */
          .footer {
            height: 120px;
            border-top: 2px solid #000;
            display: flex;
            page-break-inside: avoid;
            flex-shrink: 0;
            /* Position relative in flex flow */
            width: 100%;
          }

          .footer-remarks {
            flex: 1;
            border-right: 2px solid #000;
            padding: 10px;
            display: flex;
            flex-direction: column;
          }
          .remarks-title { font-weight: bold; margin-bottom: 5px; }

          .footer-totals {
            width: 35%;
            display: flex;
            flex-direction: column;
          }

          .total-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #000;
            font-size: 14px;
            font-weight: bold;
            background-color: #f0f0f0;
          }

          .sign-box {
            flex: 1;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            padding: 10px;
            font-weight: bold;
            font-style: italic;
          }

        </style>

      </head>

      <body>

        <div class="container">

          <div class="header-section">
            <div class="header-left">
              <div class="logo-container">
                 <img src="${logoBase64}" class="logo-img" />
              </div>
              <div class="company-info">
                <div class="company-name">JK SERVICE & DECORS</div>
                <div>Address: Indhra Nagar,</div>
                <div>Konavaikkal, Vasan College,</div>
                <div>Bhavani, Tamil Nadu 638316</div>
                <div style="margin-top: 5px;"><strong>Phone: 96981 92330</strong></div>
              </div>
            </div>
            
            <div class="header-right">
               <div class="bill-info-container">
                  <div class="info-row">
                    <span class="info-label">Bill To:</span>
                    <span class="info-val">${bill.customerName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-val">${bill.customerPhone || '-'}</span>
                  </div>
                  <div class="info-row" style="margin-top: 10px;">
                    <span class="info-label">Bill No:</span>
                    <span class="info-val">${bill.id}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Date:</span>
                    <span class="info-val">${bill.date}</span>
                  </div>
                  <div class="info-row" style="margin-top: 10px;">
                    <span class="info-label">Vehicle Name:</span>
                    <span class="info-val">${bill.vehicleName || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Vehicle No:</span>
                    <span class="info-val">${bill.vehicleNumber || '-'}</span>
                  </div>
               </div>
               ${godBase64 ? `
               <div class="god-img-container">
                  <img src="${godBase64}" class="god-img" />
               </div>
               ` : ''}
            </div>
          </div>

          <div class="mileage-strip">
            <span>Current KM: ${bill.currentKm || '0'}</span>
            <span>Next KM: ${bill.nextServiceKm || '0'}</span>
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
                  <tr>
                    <td class="col-sno">${index + 1}</td>
                    <td class="col-part">${item.name}</td>
                    <td class="col-qty">${item.qty}</td>
                    <td class="col-rate">${item.rate}</td>
                    <td class="col-amt">${item.amount}</td>
                  </tr>
                `).join('')}

                ${labour.length > 0 ? `
                  <tr class="labour-header">
                    <td></td>
                    <td class="col-part">Labour Charges</td>
                    <td class="col-qty"></td>
                    <td class="col-rate"></td>
                    <td class="col-amt"></td>
                  </tr>
                ` : ''}

                ${labour.map((item, index) => `
                  <tr>
                    <td class="col-sno">${index + 1}</td>
                    <td class="col-part">${item.name}</td>
                    <td class="col-qty">-</td>
                    <td class="col-rate">${item.rate}</td>
                    <td class="col-amt">${item.amount}</td>
                  </tr>
                `).join('')}
                


              </tbody>
            </table>
          </div>

          <div class="footer">
            <div class="footer-remarks">
               <div class="remarks-title">Remarks:</div>
               <div>${bill.remarks || ''}</div>
            </div>
            <div class="footer-totals">
               <div class="total-box">
                  <span>Total:</span>
                  <span>${bill.grandTotal.toFixed(2)}</span>
               </div>
               ${(bill.advancePayment || 0) > 0 ? `
               <div class="total-box">
                  <span>Advance Paid:</span>
                  <span>${(bill.advancePayment || 0).toFixed(2)}</span>
               </div>
               ` : ''}
               <div class="sign-box">
                  Verified By
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