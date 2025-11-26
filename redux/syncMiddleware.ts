import { Middleware } from '@reduxjs/toolkit';
import { addBill } from './billSlice';
import { supabase } from '../utils/supabase';

export const supabaseSyncMiddleware: Middleware = (store) => (next) => async (action) => {

  // Let the action update Redux immediately (UI updates instantly)
  const result = next(action);

  // Check if the action is 'addBill'
  if (addBill.match(action)) {
    const newBill = action.payload;

    console.log("Syncing bill to cloud...");

    // Direct Upload (No Auth/Session check needed)
    const { error } = await supabase.from('bills').insert({
        id: newBill.id,
        // No user_id needed
        customer_name: newBill.customerName,
        vehicle_number: newBill.vehicleNumber,
        date: newBill.date,
        status: newBill.status,
        amount: newBill.amount,
        items: newBill.items,
        subtotal: newBill.subtotal,
        tax: newBill.tax,
        grand_total: newBill.grandTotal,
        remarks: newBill.remarks,
        current_km: newBill.currentKm,
        next_service_km: newBill.nextServiceKm,
        customer_phone: newBill.customerPhone
    });

    if (error) {
      console.error("Supabase Sync Error:", error.message);
    } else {
      console.log("Bill synced successfully!");
    }
  }

  return result;
};