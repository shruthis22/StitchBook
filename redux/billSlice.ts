import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// --- Interfaces ---
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
  items: Array<{ name: string; qty: number; rate: number; amount: number }>;
  customerPhone?: string;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
}

export interface BillingState {
  products: Product[];
  bills: Bill[];
}


const initialState: BillingState = {
  products: [],
  bills: [ ],
};


const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
    addBill: (state, action: PayloadAction<Bill>) => {
      state.bills.unshift(action.payload); // Add to top
    },
  },
});

export const { addProduct, addBill } = billingSlice.actions;
export default billingSlice.reducer;