import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Alert, Platform } from 'react-native';
import { Bill } from '../redux/billSlice';

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface LedgerOptions {
  partyName: string;
  fromDate: Date;
  toDate: Date;
  bills: Bill[];
}

export const printPartyLedger = async ({ partyName, fromDate, toDate, bills }: LedgerOptions) => {
  // Load logo
  const logoAsset = Asset.fromModule(require('../assets/logo.png'));
  await logoAsset.downloadAsync();
  let logoBase64 = '';
  try {
    if (Platform.OS === 'web') {
      logoBase64 = logoAsset.uri || '';
    } else if (logoAsset.localUri) {
      const tempPath = FileSystem.cacheDirectory + 'ledger_logo_' + Date.now() + '.png';
      await FileSystem.copyAsync({ from: logoAsset.localUri, to: tempPath });
      const b64 = await FileSystem.readAsStringAsync(tempPath, { encoding: FileSystem.EncodingType.Base64 });
      logoBase64 = `data:image/png;base64,${b64}`;
    }
  } catch (e) { console.warn('Logo load failed', e); }

  const fromStr = fromDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const toStr = toDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Build ledger rows
  type LedgerRow = {
    date: Date;
    description: string;
    subItems: string[];
    credit: number;
    debit: number;
  };

  const rows: LedgerRow[] = [];

  // Sort bills by date
  const sorted = [...bills].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const bill of sorted) {
    const billDate = new Date(bill.date);

    // Bill as DEBIT
    const billAmount = Number(bill.grandTotal) || Number(bill.amount) || 0;
    const subItems = (bill.items || []).map(item =>
      `${item.name} × ${item.qty} ${item.unit || 'Nos'} @ ₹${Number(item.rate).toLocaleString('en-IN')}`
    );
    rows.push({
      date: billDate,
      description: `Bill ${bill.id}`,
      subItems,
      credit: 0,
      debit: billAmount,
    });

    // Payments as CREDIT (within the date range)
    for (const payment of (bill.paymentHistory || [])) {
      const pDate = new Date(payment.date);
      if (pDate >= fromDate && pDate <= toDate) {
        rows.push({
          date: pDate,
          description: `Payment Received (${payment.method || 'Cash'})`,
          subItems: [],
          credit: Number(payment.amount),
          debit: 0,
        });
      }
    }
  }

  // Sort all rows by date
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Totals
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closingBalance = totalDebit - totalCredit;

  // Build HTML rows
  const rowsHtml = rows.map(r => {
    const subHtml = r.subItems.map(s =>
      `<tr><td></td><td style="font-size:9px;color:#555;padding-left:20px;">↳ ${s}</td><td></td><td></td></tr>`
    ).join('');
    return `
      <tr>
        <td>${r.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
        <td>${r.description}</td>
        <td style="text-align:right;">${r.credit > 0 ? fmtAmt(r.credit) : ''}</td>
        <td style="text-align:right;">${r.debit > 0 ? fmtAmt(r.debit) : ''}</td>
      </tr>
      ${subHtml}
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; padding: 24px; }
  .header { text-align: center; margin-bottom: 16px; }
  .logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 6px; }
  .company-name { font-size: 18px; font-weight: bold; color: #164f79; letter-spacing: 1px; }
  .ledger-title { font-size: 11px; color: #444; margin-top: 4px; }
  .party-box { border: 1px solid #ccc; padding: 6px 12px; margin-bottom: 12px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead tr { background: #1F2937; color: #fff; }
  thead th { padding: 7px 8px; text-align: left; font-size: 11px; }
  thead th:last-child, thead th:nth-child(3) { text-align: right; }
  tbody tr:nth-child(even) { background: #f9f9f9; }
  tbody td { padding: 5px 8px; font-size: 10.5px; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: bold; border-top: 2px solid #1F2937; padding-top: 8px; font-size: 11px; }
  .closing-row td { font-weight: bold; color: #EF4444; font-size: 12px; }
  .footer { margin-top: 24px; font-size: 10px; color: #888; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <img src="${logoBase64}" class="logo" />
  <div class="company-name">S.S. &amp; CO EXPLOSIVES</div>
  <div class="ledger-title">LEDGER FOR THE PERIOD ${fromStr} TO ${toStr}</div>
</div>

<div class="party-box">
  <strong>Party:</strong> ${partyName}
</div>

<table>
  <thead>
    <tr>
      <th style="width:80px;">DATE</th>
      <th>DESCRIPTION</th>
      <th style="width:110px;text-align:right;">CREDIT (₹)</th>
      <th style="width:110px;text-align:right;">DEBIT (₹)</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHtml}
    <tr class="total-row">
      <td colspan="2">TOTAL</td>
      <td style="text-align:right;">${fmtAmt(totalCredit)}</td>
      <td style="text-align:right;">${fmtAmt(totalDebit)}</td>
    </tr>
    <tr class="closing-row">
      <td colspan="2">Closing Balance Due</td>
      <td></td>
      <td style="text-align:right;">${fmtAmt(Math.max(0, closingBalance))}</td>
    </tr>
  </tbody>
</table>

<div class="footer">
  Generated by SS &amp; CO Explosives App &bull; ${new Date().toLocaleString('en-IN')}
</div>

</body>
</html>
  `;

  try {
    await Print.printAsync({ html });
  } catch (e: any) {
    Alert.alert('Error', 'Failed to generate ledger: ' + e.message);
  }
};
