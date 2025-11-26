import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../utils/supabase'; // Make sure this path is correct

// --- Interfaces ---

// 1. Extracted Item Interface for cleaner code
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
  
  // Uses the new specific interface
  items: BillItem[]; 
  
  customerPhone?: string;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  remarks: string;
  
  // Optional because old bills might not have them
  currentKm?: number; 
  nextServiceKm?: number;
}

export interface BillingState {
  products: Product[];
  bills: Bill[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed'; // Track sync status
}

const initialState: BillingState = {
  products: [],
  bills: [],
  status: 'idle',
};

// --- Async Thunk (The Download Logic) ---
export const fetchBillsFromSupabase = createAsyncThunk(
  'billing/fetchBills',
  async (_, { rejectWithValue }) => {
    try {
      // 1. Select all bills
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Map Database Format (snake_case) to App Format (camelCase)
      const formattedData: Bill[] = data.map((item: any) => ({
        id: item.id,
        customerName: item.customer_name,
        vehicleNumber: item.vehicle_number,
        date: item.date,
        status: item.status,
        amount: item.amount,
        items: item.items, // JSONB array works automatically
        subtotal: item.subtotal,
        tax: item.tax,
        discount: item.discount || 0,
        grandTotal: item.grand_total,
        remarks: item.remarks,
        currentKm: item.current_km,          // Maps current_km -> currentKm
        nextServiceKm: item.next_service_km, // Maps next_service_km -> nextServiceKm
        customerPhone: item.customer_phone
      }));

      return formattedData;
    } catch (error: any) {
      console.error('Fetch Error:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

// --- The Slice ---
const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
    // We still keep this! The Middleware catches it to upload, 
    // but this line updates the UI instantly.
    addBill: (state, action: PayloadAction<Bill>) => {
      state.bills.unshift(action.payload); 
    },
  },
  
  // This handles the result of the download (fetchBillsFromSupabase)
  extraReducers: (builder) => {
    builder
      .addCase(fetchBillsFromSupabase.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBillsFromSupabase.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Only update if we actually got data back
        if (action.payload && action.payload.length > 0) {
          state.bills = action.payload;
        }
      })
      .addCase(fetchBillsFromSupabase.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { addProduct, addBill } = billingSlice.actions;
export default billingSlice.reducer;