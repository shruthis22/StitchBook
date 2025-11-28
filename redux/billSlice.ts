import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';



const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxK6qlOEAWuXqMG67sIvbH-sX7ZvwSoTAtTQsbu5LWPXX--C4tAQpCXIWOGmLYCQxTj/exec";


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

// --- Async Thunks ---

// 1. Fetch Products (GET ?type=products)
export const fetchProductsFromGoogleSheets = createAsyncThunk(
  'billing/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${GOOGLE_SHEET_API_URL}?type=products`);
      const data = await response.json();
      if (data.status === 'error') throw new Error(data.message);
      return data as Product[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 2. Save Product (POST { ...product, _sheetType: 'products' })
export const saveProductToGoogleSheets = createAsyncThunk(
  'billing/saveProduct',
  async (newProduct: Product, { rejectWithValue }) => {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        // We add _sheetType so Apps Script knows where to put it
        body: JSON.stringify({ ...newProduct, _sheetType: 'products' }),
      });
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return newProduct;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 3. Fetch Bills (GET ?type=bills)
export const fetchBillsFromGoogleSheets = createAsyncThunk(
  'billing/fetchBills',
  async (_, { rejectWithValue }) => {
    try {
      // Default type is bills, but being explicit helps
      const response = await fetch(`${GOOGLE_SHEET_API_URL}?type=bills`);
      const data = await response.json();
      if (data.status === 'error') throw new Error(data.message);
      return data as Bill[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 4. Save Bill (POST)
export const saveBillToGoogleSheets = createAsyncThunk(
  'billing/saveBill',
  async (newBill: Bill, { rejectWithValue }) => {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...newBill, _sheetType: 'bills' }),
      });
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return newBill;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// --- The Slice ---
const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    // Legacy local reducers (optional now)
    addProductLocal: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
  },

  extraReducers: (builder) => {
    builder
      // Products
      .addCase(fetchProductsFromGoogleSheets.fulfilled, (state, action) => {
        state.products = action.payload;
      })
      .addCase(saveProductToGoogleSheets.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })

      // Bills
      .addCase(fetchBillsFromGoogleSheets.fulfilled, (state, action) => {
        state.bills = action.payload;
      });
  },
});

export const { addProductLocal } = billingSlice.actions;
export default billingSlice.reducer;