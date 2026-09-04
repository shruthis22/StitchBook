import re

path = r'c:\Users\shrut\OneDrive\Desktop\explosives\SSandCO explosives\redux\billSlice.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Interfaces
interfaces = '''
export interface StockLedger {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  qty: number;
  remarks: string;
  referenceId?: string; // e.g. Bill ID
}
'''
text = re.sub(r'(export interface Product \{)', interfaces + r'\n\1', text)

# 2. State
text = re.sub(r'(customers: Customer\[\];)', r'\1\n  stockLedger: StockLedger[];', text)

# 3. Initial State
text = re.sub(r'(customers: \[\],)', r'\1\n  stockLedger: [],', text)

# 4. Thunks
thunks = '''
// --- STOCK LEDGER THUNKS ---
export const fetchStockLedgerFromGoogleSheets = createAsyncThunk(
  'billing/fetchStockLedger',
  async (_, { rejectWithValue }) => {
    try {
      const data = await safeFetch(`${GOOGLE_SHEET_API_URL}?type=inventory_ledger`);
      if (data.status === 'error') throw new Error(data.message);
      if (!Array.isArray(data)) return [];

      return data.map((s: any) => ({
        id: String(s.id),
        date: String(s.date),
        type: s.type === 'IN' || s.type === 'OUT' ? s.type : 'IN',
        qty: Number(s.qty) || 0,
        remarks: String(s.remarks || ''),
        referenceId: s.referenceId ? String(s.referenceId) : ''
      })) as StockLedger[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveStockEntryToGoogleSheets = createAsyncThunk(
  'billing/saveStockEntry',
  async (newEntry: StockLedger, { rejectWithValue }) => {
    try {
      const payload = { ...newEntry, _sheetType: 'inventory_ledger' };
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (result.status === 'error') throw new Error(result.message);
      return newEntry;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
'''
text = re.sub(r'(// The Slice)', thunks + r'\n\1', text)

# 5. Extra Reducers
reducers = '''
      // Stock Ledger
      .addCase(fetchStockLedgerFromGoogleSheets.fulfilled, (state, action) => {
        state.stockLedger = action.payload;
      })
      .addCase(saveStockEntryToGoogleSheets.fulfilled, (state, action) => {
        state.stockLedger.push(action.payload);
      })
'''
text = re.sub(r'(// Customers)', reducers + r'\n      \1', text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated billSlice.ts for stocks')
