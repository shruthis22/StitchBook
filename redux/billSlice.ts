import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from './store';



// REPLACE THIS WITH YOUR NEW DEPLOYED GOOGLE APPS SCRIPT URL
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxKQsFDGbo-UhmbLkI5UV5MVHmQgApc7rUAHrpI6xjuU3WzjpSIJL6O9suSimN8CzDl3w/exec";


// --- Interfaces ---
export interface BillItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
  amount: number;
  type: 'product' | 'labour';
  unit?: "Box" | "Nos";
  productId?: string;
  productName?: string;
}


export interface Customer {
  id: string;
  name: string;
  phone: string;
  managerName?: string;
  managerPhone?: string;
}


export interface StockLedger {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  qty: number;
  remarks: string;
  referenceId?: string; // e.g. Bill ID
  unit?: 'Box' | 'Nos';
}

export interface Product {
  id: string;
  name: string;
  price: string;
  unit?: 'Box' | 'Nos';
}

export interface Bill {
  id: string;
  customerName: string;
  vehicleNumber: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  amount: number;
  items: BillItem[];
  customerPhone?: string;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  remarks: string;
  currentKm?: number;
  nextServiceKm?: number;
  vehicleName?: string;
  advancePayment?: number;
  nextServiceDate?: string;
  pendingAmount?: number;
  paymentHistory?: { date: string; amount: number; method?: 'Cash' | 'Online' }[];
}

export interface BillingState {
  customers: Customer[];
  stockLedger: StockLedger[];

  products: Product[];
  bills: Bill[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: BillingState = {
  customers: [],
  stockLedger: [],

  products: [],
  bills: [],
  status: 'idle',
  error: null,
};








// --- Helper: Safe Fetch with Timeout ---
const safeFetch = async (url: string, options: RequestInit = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response from server");
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
};

// --- Helper: Deep Sanitization ---
const sanitizeBillItem = (item: any): BillItem => ({
  id: String(item?.id || Math.random().toString(36).substr(2, 9)),
  name: String(item?.name || 'Unknown Item'),
  qty: Number(item?.qty) || 0,
  rate: Number(item?.rate) || 0,
  amount: Number(item?.amount) || 0,
  type: (item?.type === 'product' || item?.type === 'labour') ? item.type : 'product',
});

// Fetch Products (GET ?type=products)
export const fetchProductsFromGoogleSheets = createAsyncThunk(
  'billing/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const data = await safeFetch(`${GOOGLE_SHEET_API_URL}?type=products`);
      if (data.status === 'error') throw new Error(data.message);
      if (!Array.isArray(data)) throw new Error("Invalid data format: expected array");

      return data.map((p: any) => ({
        id: String(p.id),
        name: String(p.name),
        price: String(p.price),
          unit: (() => { const BOX_PRODUCTS = ["rex prime","rex 90","sun 90"]; return BOX_PRODUCTS.includes(String(p.name).toLowerCase().trim()) ? "Box" : "Nos"; })()
        })) as Product[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Save Product
export const saveProductToGoogleSheets = createAsyncThunk(
  'billing/saveProduct',
  async (newProduct: Product, { rejectWithValue }) => {
    try {
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...newProduct, _sheetType: 'products' }),
      });
      if (result.status === 'error') throw new Error(result.message);
      return newProduct;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch Bills (GET ?type=bills)
export const fetchBillsFromGoogleSheets = createAsyncThunk(
  'billing/fetchBills',
  async (_, { rejectWithValue }) => {
    try {
      const data = await safeFetch(`${GOOGLE_SHEET_API_URL}?type=bills`);
      if (data.status === 'error') throw new Error(data.message);
      if (!Array.isArray(data)) throw new Error("Invalid data format: expected array");

      // Deep Sanitize Data
      const sanitizedBills = data.map((b: any) => {
        // Handle 'items' which might be a JSON string or already an object
        let parsedItems: BillItem[] = [];
        try {
          if (typeof b.items === 'string') {
            parsedItems = JSON.parse(b.items);
            // Handle double stringification
            while (typeof parsedItems === 'string') {
              parsedItems = JSON.parse(parsedItems);
            }
          } else if (Array.isArray(b.items)) {
            parsedItems = b.items;
          }
        } catch (e) {
          console.warn("Failed to parse items for bill", b.id);
          parsedItems = [];
        }

        // FIX: Assign correct unit based on product name for old bills
        const BOX_PRODUCTS = ['rex prime', 'rex 90', 'sun 90'];
        if (Array.isArray(parsedItems)) {
          parsedItems = parsedItems.map(item => {
             const nameStr = (item.name || '').trim().toLowerCase();
             const isBox = BOX_PRODUCTS.includes(nameStr);
             return { ...item, unit: isBox ? 'Box' : 'Nos' };
          });
        }

        let parsedHistory: { date: string; amount: number; method?: 'Cash' | 'Online' }[] = [];
        try {
          if (typeof b.paymentHistory === 'string') {
            parsedHistory = JSON.parse(b.paymentHistory);
            // Handle double stringification
            while (typeof parsedHistory === 'string') {
              parsedHistory = JSON.parse(parsedHistory);
            }
          } else if (Array.isArray(b.paymentHistory)) {
            parsedHistory = b.paymentHistory;
          }
        } catch (e) {
          console.warn("Failed to parse paymentHistory for bill", b.id);
          parsedHistory = [];
        }

        return {
          ...b,
          id: String(b.id),
          customerName: String(b.customerName || 'Unknown'),
          vehicleNumber: String(b.vehicleNumber || ''),
          date: String(b.date || new Date().toISOString()),
          status: b.status || 'Pending',
          amount: Number(b.amount) || 0,
          subtotal: Number(b.subtotal) || 0,
          tax: Number(b.tax) || 0,
          discount: Number(b.discount) || 0,
          grandTotal: Number(b.grandTotal) || 0,
          remarks: String(b.remarks || ''),
          currentKm: Number(b.currentKm) || 0,
          nextServiceKm: Number(b.nextServiceKm) || 0,
          advancePayment: b.advancePayment ? Number(b.advancePayment) : 0,
          nextServiceDate: b.nextServiceDate ? String(b.nextServiceDate) : '',
          pendingAmount: b.pendingAmount ? Number(b.pendingAmount) : 0,
          // CRITICAL: Ensure items is always an array of valid objects
          items: Array.isArray(parsedItems) ? parsedItems.map(sanitizeBillItem) : [],
          paymentHistory: Array.isArray(parsedHistory) ? parsedHistory : [],
        };
      });

      return sanitizedBills as Bill[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Save Bill
export const saveBillToGoogleSheets = createAsyncThunk(
  'billing/saveBill',
  async (newBill: Bill, { rejectWithValue }) => {
    try {
      const payload = {
        ...newBill,
        items: JSON.stringify(newBill.items || []),
        paymentHistory: JSON.stringify(newBill.paymentHistory || []),
        _sheetType: 'bills'
      };
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (result.status === 'error') throw new Error(result.message);
      return newBill;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete Product
export const deleteProductFromGoogleSheets = createAsyncThunk(
  'billing/deleteProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'delete', type: 'products', id: productId }),
      });
      if (result.status === 'error') throw new Error(result.message);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete Bill
export const deleteBillFromGoogleSheets = createAsyncThunk(
  'billing/deleteBill',
  async (billId: string, { rejectWithValue }) => {
    try {
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'delete', type: 'bills', id: billId }),
      });
      if (result.status === 'error') throw new Error(result.message);
      return billId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBillInGoogleSheets = createAsyncThunk(
  'billing/updateBill',
  async (
    { id, updates }: { id: string; updates: Partial<Bill> },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const existingBill = state.billing.bills.find((b: any) => b.id === id);
      if (!existingBill) throw new Error('Bill not found locally');

      const updatedBill = { ...existingBill, ...updates };

      // 1. Delete old row
      await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'delete', type: 'bills', id }),
      });

      // 2. Save updated row
      const payload = {
        ...updatedBill,
        items: JSON.stringify(updatedBill.items || []),
        paymentHistory: JSON.stringify(updatedBill.paymentHistory || []),
        _sheetType: "bills"
      };
      
      const saveResult = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (saveResult.status === "error") throw new Error(saveResult.message);
      
      return { id, updates };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// --- CUSTOMER THUNKS ---
export const fetchCustomersFromGoogleSheets = createAsyncThunk(
  "billing/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const data = await safeFetch(GOOGLE_SHEET_API_URL + "?type=customers");
      if (data.status === "error") throw new Error(data.message);
      if (!Array.isArray(data)) return [];

      return data.map((c: any) => ({
        id: String(c.id),
        name: String(c.name),
        phone: String(c.phone || ""),
        managerName: c.managerName ? String(c.managerName) : undefined,
        managerPhone: c.managerPhone ? String(c.managerPhone) : undefined
      })) as Customer[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveCustomerToGoogleSheets = createAsyncThunk(
  "billing/saveCustomer",
  async (newCustomer: Customer, { rejectWithValue }) => {
    try {
      const payload = { ...newCustomer, _sheetType: "customers" };
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (result.status === "error") throw new Error(result.message);
      return newCustomer;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCustomerFromGoogleSheets = createAsyncThunk(
  'billing/deleteCustomer',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'delete', type: 'customers', id: customerId }),
      });
      if (result.status === 'error') throw new Error(result.message);
      return customerId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);


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
        referenceId: s.referenceId ? String(s.referenceId) : '',
          unit: s.unit === "Nos" ? "Nos" : "Box",
          productId: s.productId ? String(s.productId) : undefined,
          productName: s.productName ? String(s.productName) : undefined
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

// The Slice
const billingSlice = createSlice({


  name: 'billing',
  initialState,
  reducers: {},

  extraReducers: (builder) => {

    builder
      
      // Stock Ledger
      .addCase(fetchStockLedgerFromGoogleSheets.fulfilled, (state, action) => {
        state.stockLedger = action.payload;
      })
      .addCase(saveStockEntryToGoogleSheets.fulfilled, (state, action) => {
        if (!state.stockLedger) state.stockLedger = [];
          state.stockLedger.push(action.payload);
      })

      // Customers
      .addCase(fetchCustomersFromGoogleSheets.fulfilled, (state, action) => {
        state.customers = action.payload;
      })
      .addCase(saveCustomerToGoogleSheets.fulfilled, (state, action) => {
        if (!state.customers) state.customers = [];
          state.customers.push(action.payload);
      })
      .addCase(deleteCustomerFromGoogleSheets.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c.id !== action.payload);
      })

      // Products
      .addCase(fetchProductsFromGoogleSheets.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(saveProductToGoogleSheets.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      .addCase(deleteProductFromGoogleSheets.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
      })

      // Bills
      .addCase(fetchBillsFromGoogleSheets.fulfilled, (state, action) => {
        const fetchedBills = action.payload;
        
        // Merge fetched bills with local state to preserve dropped fields
        state.bills = fetchedBills.map((fetchedBill: Bill) => {
          const localBill = state.bills.find(b => b.id === fetchedBill.id);
          if (localBill) {
            return {
              ...fetchedBill,
              nextServiceDate: fetchedBill.nextServiceDate || localBill.nextServiceDate,
              advancePayment: fetchedBill.advancePayment || localBill.advancePayment,
              pendingAmount: fetchedBill.pendingAmount || localBill.pendingAmount,
              paymentHistory: fetchedBill.paymentHistory || localBill.paymentHistory,
            };
          }
          return fetchedBill;
        });
      })
      .addCase(saveBillToGoogleSheets.fulfilled, (state, action) => {
        const exists = state.bills.some(b => b.id === action.payload.id);
        if (!exists) {
          state.bills.unshift(action.payload);
        }
      })
      .addCase(updateBillInGoogleSheets.fulfilled, (state, action) => {
        const index = state.bills.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bills[index] = { ...state.bills[index], ...action.payload.updates };
        }
      })
      .addCase(deleteBillFromGoogleSheets.fulfilled, (state, action) => {
        state.bills = state.bills.filter(b => b.id !== action.payload);
      });
  },
});






//export const { addProductLocal } = billingSlice.actions;
export default billingSlice.reducer;