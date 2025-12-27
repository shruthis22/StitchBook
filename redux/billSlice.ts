import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';



const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxRVHgm4F4gXPBStRMKuDaHvUGTtnd-GeIMfNjHrtzW2AsGZ1p9sViVDWRC9b3fCuAh/exec";


// --- Interfaces ---
export interface BillItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
  amount: number;
  type: 'product' | 'labour';
}

export interface Product {
  id: string;
  name: string;
  price: string;
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
}

export interface BillingState {
  products: Product[];
  bills: Bill[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: BillingState = {
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
        price: String(p.price)
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
          } else if (Array.isArray(b.items)) {
            parsedItems = b.items;
          }
        } catch (e) {
          console.warn("Failed to parse items for bill", b.id);
          parsedItems = [];
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
          // CRITICAL: Ensure items is always an array of valid objects
          items: Array.isArray(parsedItems) ? parsedItems.map(sanitizeBillItem) : [],
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
      const result = await safeFetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...newBill, _sheetType: 'bills' }),
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

// The Slice
const billingSlice = createSlice({


  name: 'billing',
  initialState,
  reducers: {},

  extraReducers: (builder) => {

    builder
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
        state.bills = action.payload;
      })
      .addCase(deleteBillFromGoogleSheets.fulfilled, (state, action) => {
        state.bills = state.bills.filter(b => b.id !== action.payload);
      });
  },
});






//export const { addProductLocal } = billingSlice.actions;
export default billingSlice.reducer;