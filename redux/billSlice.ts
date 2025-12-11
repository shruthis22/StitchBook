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








// Fetch Products (GET ?type=products)
export const fetchProductsFromGoogleSheets = createAsyncThunk(

  'billing/fetchProducts',

  async (_, { rejectWithValue }) => {

    try {
      const response = await fetch(`${GOOGLE_SHEET_API_URL}?type=products`);

      const data = await response.json();

      if (data.status === 'error') throw new Error(data.message);

      // Sanitize Data: Ensure all fields are the correct primitive type
      const sanitizedProducts = (data as any[]).map(p => ({
        id: String(p.id),
        name: String(p.name),
        price: String(p.price)
      }));

      return sanitizedProducts as Product[];
    }
    catch (error: any) {
      return rejectWithValue(error.message);
    }


  }
);












// Save Product (POST { ...product, _sheetType: 'products' })
export const saveProductToGoogleSheets = createAsyncThunk(

  'billing/saveProduct',


  async (newProduct: Product, { rejectWithValue }) => {


    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        // We add _sheetType so Apps Script knows where to put it
        body: JSON.stringify({ ...newProduct, _sheetType: 'products' }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return newProduct;
    }
    catch (error: any) {
      if (error.name === 'AbortError') {
        return rejectWithValue("Request timed out");
      }
      return rejectWithValue(error.message);
    }


  }
);













// Fetch Bills (GET ?type=bills)
export const fetchBillsFromGoogleSheets = createAsyncThunk(
  'billing/fetchBills',
  async (_, { rejectWithValue }) => {
    try {
      // Default type is bills, but being explicit helps
      const response = await fetch(`${GOOGLE_SHEET_API_URL}?type=bills`);
      const data = await response.json();
      if (data.status === 'error') throw new Error(data.message);

      // Sanitize Data
      const sanitizedBills = (data as any[]).map(b => ({
        ...b,
        id: String(b.id),
        customerName: String(b.customerName),
        vehicleNumber: String(b.vehicleNumber || ''),
        amount: Number(b.amount) || 0,
        subtotal: Number(b.subtotal) || 0,
        tax: Number(b.tax) || 0,
        discount: Number(b.discount) || 0,
        grandTotal: Number(b.grandTotal) || 0,
        currentKm: Number(b.currentKm) || 0,
        nextServiceKm: Number(b.nextServiceKm) || 0,
        advancePayment: b.advancePayment ? Number(b.advancePayment) : 0,
      }));

      return sanitizedBills as Bill[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);











// Save Bill (POST)
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




// Delete Product (POST { action: 'delete', type: 'products', id: ... })
export const deleteProductFromGoogleSheets = createAsyncThunk(
  'billing/deleteProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'delete', type: 'products', id: productId }),
      });
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return productId; // Return ID to remove from state
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete Bill (POST { action: 'delete', type: 'bills', id: ... })
export const deleteBillFromGoogleSheets = createAsyncThunk(
  'billing/deleteBill',
  async (billId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: 'delete', type: 'bills', id: billId }),
      });
      const result = await response.json();
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