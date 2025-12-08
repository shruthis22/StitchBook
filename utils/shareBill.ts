import { Asset } from 'expo-asset';
import * as Print from 'expo-print';
import { shareAsync } from "expo-sharing";
import { Bill } from '../redux/billSlice';



const numberToWords = (num: number): string => {
  return `${num} (Only)`;
};



const convertUriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};





export const shareBill = async (bill: Bill) => {

  const products = bill.items.filter(item => item.type === 'product');
  const labour = bill.items.filter(item => item.type === 'labour');


  const logoAsset = Asset.fromModule(require('../assets/company-logo.png'));
  await logoAsset.downloadAsync();

  let logoBase64 = "";
  if (logoAsset.localUri) {
    try {
      logoBase64 = await convertUriToBase64(logoAsset.localUri);
    } catch (e) {
      console.error("Failed to load logo", e);
      logoBase64 = "https://cdn-icons-png.flaticon.com/512/741/741407.png";
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
            min-height: 98vh; /* Allow growth */
            /* Removed fixed height and flex to allow multi-page flow */
            display: block;
            position: relative;
            padding-bottom: 120px; /* Ensure space for footer */
          }

          /* --- Header Section --- */
          .header-section {
            display: flex;
            border-bottom: 2px solid #000;
            height: 180px; 
            /* flex-shrink: 0; removed as not in flex container anymore */
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
            color: #000;
          }

          /* Right Header */
          .header-right {
            width: 50%;
            padding: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            font-size: 13px;
            line-height: 1.6;
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
            /* flex-shrink: 0; removed */
          }

          /* --- Table Section --- */
          .table-container { 
            /* flex: 1; removed */
            width: 100%;
            display: block; 
          }
          
          table { 
            width: 100%; 
            border-collapse: separate; 
            border-spacing: 0; /* CRITICAL: Removes gaps between cells */
          }
          
          th { 
            border-bottom: 2px solid #000; 
            border-right: 1px solid #000;
            padding: 8px; 
            text-align: center;
            font-weight: bold;
            background-color: #eee;
            height: 30px; 
          }
          
          /* Ensure header border matches column border logic */
          th:last-child { border-right: none; }

          thead { display: table-header-group; } /* Repeats header on new pages */

          tbody tr {
            height: auto; /* Allow natural height */
            page-break-inside: avoid; /* Prevent row splitting */
          }

          /* Filler row expands to fill space */
          tr.filler-row {
            height: 50px; /* Give it some minimum height if needed, or remove if not using flex grow */
            display: none; /* Hide filler row in multi-page layout as we just want content to flow */
          }
          
          td { 
            border-bottom: 1px solid #ccc; /* Add light row separators for readablity helps in multi-page */
            border-right: 1px solid #000; 
            padding: 5px 8px;
            vertical-align: top;
          }
          /* We need a bottom border for the last row of the table? Or strictly stick to the outer border? 
             With multi-page, table borders are tricky. keeping verticals. */

          /* Remove right border from last column */
          .col-amt, th.col-amt { border-right: none; }

          .col-sno { width: 50px; text-align: center; }
          .col-part { text-align: left; }
          .col-qty { width: 60px; text-align: center; }
          .col-rate { width: 80px; text-align: right; }
          .col-amt { width: 100px; text-align: right; }

          .labour-header td {
             font-weight: bold;
             text-decoration: underline;
             padding-top: 10px;
             height: auto; 
             border-right: 1px solid #000; 
             border-bottom: none;
          }
          .labour-header td:last-child { border-right: none; }

          /* --- Footer Section --- */
          .footer {
            height: 120px;
            border-top: 2px solid #000;
            display: flex;
            page-break-inside: avoid; /* Keep footer together */
            position: absolute;
            bottom: 0;
            left: 0;
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
                <div class="company-name">JK CARS & DECORS</div>
                <div>Address: Indhra Nagar,</div>
                <div>Konavaikkal, Vasan College,</div>
                <div>Bhavani, Tamil Nadu 638316</div>
                <div style="margin-top: 5px;"><strong>Phone: 96981 92330</strong></div>
              </div>
            </div>
            
            <div class="header-right">
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
                 <span class="info-val">${new Date(bill.date).toLocaleDateString()}</span>
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
                
                <tr class="filler-row">
                  <td class="col-sno">&nbsp;</td>
                  <td class="col-part">&nbsp;</td>
                  <td class="col-qty">&nbsp;</td>
                  <td class="col-rate">&nbsp;</td>
                  <td class="col-amt">&nbsp;</td>
                </tr>

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
  await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};