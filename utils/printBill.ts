import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Bill } from '../redux/billSlice';

// Helper to convert number to words (Simplified version)
const numberToWords = (num: number): string => {
  return `${num} (Only)`;
};

export const printBill = async (bill: Bill) => {

  const products = bill.items.filter(item => item.type === 'product');
  const labour = bill.items.filter(item => item.type === 'labour');

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
            position: relative; /* <--- CHANGED: Added relative positioning so the watermark stays inside this border */
            z-index: 1;         /* <--- CHANGED: Added z-index context */
          }

          /* <--- NEW SECTION: Watermark Styling */
          .watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg); /* Center and rotate */
  
  font-size: 80px;       /* Increased size for better visibility */
  font-weight: 900;
  
  /* Use RGBA for color: Black with 0.1 (10%) Opacity */
  color: rgba(0, 0, 0, 0.10); 
  
  /* <--- KEY FIX: Put it ON TOP of the text, not behind */
  z-index: 9999;   
  
  text-align: center;
  line-height: 90px;
  white-space: nowrap;
  pointer-events: none;  /* Ensures it doesn't block any interaction */
}
          
          .header { 
            display: flex; 
            border-bottom: 2px solid #000; 
            flex-shrink: 0; 
            background-color: transparent; /* <--- CHANGED: Ensure background is transparent so watermark shows through */
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
            background-color: transparent; /* <--- CHANGED: Transparent background */
          }
          
          table { 
            width: 100%; 
            height: 100%; 
            border-collapse: collapse; 
            table-layout: fixed; 
            background-color: transparent; /* <--- CHANGED: Transparent background */
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
            background-color: white; /* <--- CHANGED: Keep footer white to make text readable over watermark */
          }
          
          .footer-bottom { 
            flex-shrink: 0; 
            display: flex; 
            height: 120px;
            background-color: white; /* <--- CHANGED: Keep footer white */
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