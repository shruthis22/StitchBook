import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Alert, Platform } from 'react-native';
import { Bill } from '../redux/billSlice';

function fmtAmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface LedgerOptions {
  partyName: string;
  partyPhone?: string;
  fromDate: Date;
  toDate: Date;
  bills: Bill[];
}

export const printPartyLedger = async ({ partyName, partyPhone, fromDate, toDate, bills }: LedgerOptions) => {
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
    date: string;
    description: string;
    subItems: string[];
    credit: number;
    debit: number;
  };

  const rows: LedgerRow[] = [];

  // Sort bills by date string
  const sorted = [...bills].sort((a, b) => a.date.localeCompare(b.date));

  for (const bill of sorted) {
    const billAmount = Number(bill.grandTotal) || Number(bill.amount) || 0;
    const subItems = (bill.items || []).map(item =>
      `${item.name} &times; ${item.qty} ${item.unit || 'Nos'} @ &#8377;${Number(item.rate).toLocaleString('en-IN')}`
    );

    // Only add bill row if it's not an old-balance dummy (items empty but remarked)
    const label = bill.remarks === 'Old Balance' ? 'Opening Balance' : `Bill ${bill.id}`;

    rows.push({
      date: bill.date,
      description: label,
      subItems,
      credit: 0,
      debit: billAmount,
    });

    // Payments within the date range
    for (const payment of (bill.paymentHistory || [])) {
      rows.push({
        date: payment.date || bill.date,
        description: `Payment Received (${payment.method || 'Cash'})`,
        subItems: [],
        credit: Number(payment.amount),
        debit: 0,
      });
    }
  }

  // Totals
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closingBalance = Math.max(0, totalDebit - totalCredit);

  // Build HTML rows
  const rowsHtml = rows.map(r => {
    const subHtml = r.subItems.map(s =>
      `<tr><td></td><td style="font-size:9px;color:#555;padding-left:18px;">&#8627; ${s}</td><td></td><td></td></tr>`
    ).join('');
    return `
      <tr>
        <td style="white-space:nowrap;">${r.date}</td>
        <td>${r.description}</td>
        <td style="text-align:right;white-space:nowrap;">${r.credit > 0 ? fmtAmt(r.credit) : ''}</td>
        <td style="text-align:right;white-space:nowrap;">${r.debit > 0 ? fmtAmt(r.debit) : ''}</td>
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
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }

  /* ── HEADER ── */
  .header-wrap {
    display: flex; justify-content: space-between; align-items: flex-start;
    width: 100%; margin-bottom: 10px;
  }
  .col-left { width: 33%; font-size: 10.5px; line-height: 1.6; color: #164f79; }
  .col-left strong { font-size: 11px; }
  .col-center { width: 34%; text-align: center; }
  .col-right { width: 33%; font-size: 11px; line-height: 1.6; color: #164f79; text-align: right; }
  .logo { width: 64px; height: 64px; object-fit: contain; margin-bottom: 4px; }
  .company-name { font-size: 18px; font-weight: bold; color: #164f79; letter-spacing: 1px; }
  .icon-row { display: flex; align-items: flex-start; margin-top: 4px; }
  .icon-row svg { margin-right: 5px; margin-top: 1px; flex-shrink: 0; }

  .divider { border-top: 2px solid #164f79; margin: 8px 0; }
  .sub-divider { border-top: 1px solid #ccc; margin: 6px 0; }

  .ledger-title-bar {
    background: #1F2937; color: #fff; text-align: center;
    padding: 6px; font-size: 12px; font-weight: bold; letter-spacing: 0.5px;
    border-radius: 4px; margin-bottom: 12px;
  }

  /* ── TABLE ── */
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #1F2937; color: #fff; }
  thead th { padding: 7px 8px; text-align: left; font-size: 11px; }
  thead th:last-child, thead th:nth-child(3) { text-align: right; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 5px 8px; font-size: 10.5px; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: bold; border-top: 2px solid #1F2937; padding: 7px 8px; font-size: 11px; background: #f3f4f6; }
  .closing-row td { font-weight: bold; color: #DC2626; font-size: 12px; padding: 7px 8px; background: #fef2f2; }

  .footer { margin-top: 20px; font-size: 9px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header-wrap">

  <!-- LEFT: Company Details -->
  <div class="col-left">
    <strong>Lic No : A/E/SC/TN/22/929 (E88325)</strong><br><br>
    <strong>V.P. SENTHILKUMAR</strong>
    <div class="icon-row">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      <span>1/154, Somanur Road,<br>63.Velampalayam, Palladam - 641 663</span>
    </div>
    <div class="icon-row" style="margin-top:4px;">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      <span>99762 18700</span>
    </div>
    <div class="icon-row" style="margin-top:4px;">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
      <span>sscoexplosives2016@gmail.com</span>
    </div>
  </div>

  <!-- CENTER: Logo & Name -->
  <div class="col-center">
    <img src="${logoBase64}" class="logo" />
    <div class="company-name">S.S. &amp; CO EXPLOSIVES</div>
  </div>

  <!-- RIGHT: Party Details -->
  <div class="col-right">
    <div style="margin-bottom:6px;">
      <strong style="font-size:10px;color:#888;">LEDGER PERIOD</strong><br>
      <span style="font-size:12px;font-weight:bold;color:#1F2937;">${fromStr} &rarr; ${toStr}</span>
    </div>
    <div class="sub-divider"></div>
    <div style="margin-top:6px;">
      <strong style="font-size:10px;color:#888;">PARTY</strong><br>
      <span style="font-size:14px;font-weight:bold;color:#000;">${partyName}</span><br>
      ${partyPhone ? `<span style="font-size:11px;color:#555;">${partyPhone}</span>` : ''}
    </div>
  </div>

</div>

<div class="divider"></div>

<div class="ledger-title-bar">ACCOUNT STATEMENT &mdash; ${fromStr} TO ${toStr}</div>

<!-- TABLE -->
<table>
  <thead>
    <tr>
      <th style="width:90px;">DATE</th>
      <th>DESCRIPTION</th>
      <th style="width:120px;text-align:right;">CREDIT (&#8377;)</th>
      <th style="width:120px;text-align:right;">DEBIT (&#8377;)</th>
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
      <td colspan="2">&#9658; Closing Balance Due</td>
      <td></td>
      <td style="text-align:right;">${fmtAmt(closingBalance)}</td>
    </tr>
  </tbody>
</table>

<div class="footer">
  Generated by S.S. &amp; CO Explosives App &bull; ${new Date().toLocaleString('en-IN')}
</div>

</body>
</html>`;

  try {
    await Print.printAsync({ html });
  } catch (e: any) {
    Alert.alert('Error', 'Failed to generate ledger: ' + e.message);
  }
};
