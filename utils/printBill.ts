
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Bill } from '../redux/billSlice';



// Helper to convert number to words (Simplified version)
const numberToWords = (num: number): string => {
    // You can replace this with a library like 'number-to-words' for better accuracy
    return `${num} (Only)`;
};



export const printBill = async (bill: Bill) => {


    // Separate Products and Labour for the layout
    const products = bill.items.filter(item => item.type === 'product');
    const labour = bill.items.filter(item => item.type === 'labour');

    // HTML Content matching your reference image
    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 20px; }
          body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #000; }
          .container { border: 2px solid #000; height: 98vh; display: flex; flex-direction: column; justify-content: space-between; }
          
          /* Header */
          .header { display: flex; border-bottom: 2px solid #000; }
          .header-left { flex: 1; padding: 10px; border-right: 1px solid #000; }
          .header-right { width: 300px; padding: 10px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          
          /* Table */
          .table-container { flex: 1; display: flex; flex-direction: column; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border-right: 1px solid #000; padding: 5px; word-wrap: break-word; }
          th { border-bottom: 1px solid #000; background-color: #f0f0f0; font-weight: bold; text-align: center; }
          td { border-bottom: none; } /* Vertical lines only for body */
          
          /* Column Widths */
          .col-sno { width: 40px; text-align: center; }
          .col-part { width: auto; text-align: left; }
          .col-qty { width: 60px; text-align: center; }
          .col-rate { width: 80px; text-align: right; }
          .col-amt { width: 90px; text-align: right; border-right: none; }

          /* Labour Section Header */
          .labour-header td { font-weight: bold; padding-top: 15px; text-decoration: underline; border-bottom: none; }

          /* Footer Info Bar */
          .footer-info { border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 5px; font-weight: bold; display: flex; justify-content: space-between; }
          
          /* Bottom Summary */
          .footer-bottom { display: flex; height: 120px; }
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
          
          <!-- HEADER -->
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

          <!-- TABLE -->
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
                <!-- PRODUCTS -->
                ${products.map((item, index) => `
                  <tr>
                    <td class="col-sno">${index + 1}</td>
                    <td class="col-part">${item.name}</td>
                    <td class="col-qty">${item.qty}</td>
                    <td class="col-rate">${item.rate.toFixed(2)}</td>
                    <td class="col-amt">${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}

                <!-- LABOUR HEADER -->
                ${labour.length > 0 ? `
                  <tr class="labour-header">
                    <td class="col-sno"></td>
                    <td class="col-part">Labour Service Details</td>
                    <td class="col-qty"></td>
                    <td class="col-rate"></td>
                    <td class="col-amt"></td>
                  </tr>
                ` : ''}

                <!-- LABOUR ITEMS -->
                 ${labour.map((item, index) => `
                  <tr>
                    <td class="col-sno">${products.length + index + 1}</td>
                    <td class="col-part">${item.name}</td>
                    <td class="col-qty">-</td>
                    <td class="col-rate">${item.rate.toFixed(2)}</td>
                    <td class="col-amt">${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- FOOTER START -->
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

    // Print Logic
    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);
    await Print.printAsync({
    html: html,
    // On iOS, you can also specify orientation
    orientation: Print.Orientation.portrait,
  });

  
};