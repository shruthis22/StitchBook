import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCustomers, fetchOrders, fetchPayments } from '../utils/api';

export const loadAppData = createAsyncThunk('stitchbook/loadAppData', async () => {
  const [customers, orders, payments] = await Promise.all([
    fetchCustomers(),
    fetchOrders(),
    fetchPayments()
  ]);
  return { customers, orders, payments };
});

const initialState = {
  customers: [],
  orders: [],
  payments: [],
  status: 'idle',
  error: null
};

const stitchbookSlice = createSlice({
  name: 'stitchbook',
  initialState,
  reducers: {
    addCustomerLocal: (state, action) => {
      state.customers.unshift(action.payload);
    },
    addOrderLocal: (state, action) => {
      state.orders.unshift(action.payload);
    },
    addPaymentLocal: (state, action) => {
      state.payments.unshift(action.payload);
    },
    updateOrderStatusLocal: (state, action) => {
      const { order_id, status } = action.payload;
      const order = state.orders.find((o: any) => o.order_id === order_id);
      if (order) order.status = status;
    },
    updateOrderPaymentLocal: (state, action) => {
      const { order_id, amount } = action.payload;
      const order = state.orders.find((o: any) => o.order_id === order_id);
      if (order) {
        order.total_paid = (Number(order.total_paid || 0) + Number(amount)).toString();
        order.balance = (Number(order.total_amount || 0) - Number(order.total_paid)).toString();
      }
    },
    deleteOrderLocal: (state, action) => {
      state.orders = state.orders.filter((o: any) => o.order_id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAppData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadAppData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.customers = action.payload.customers;
        state.orders = action.payload.orders;
        state.payments = action.payload.payments;
      })
      .addCase(loadAppData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = 'Something went wrong. Please try again.';
      });
  }
});

export const { addCustomerLocal, addOrderLocal, addPaymentLocal, updateOrderStatusLocal, updateOrderPaymentLocal, deleteOrderLocal } = stitchbookSlice.actions;
export default stitchbookSlice.reducer;
