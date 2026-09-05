const fs = require("fs");
let content = fs.readFileSync("redux/billSlice.ts", "utf-8");
const beforePart = content.substring(0, content.indexOf("      // 2. Save updated row"));
const afterPart = content.substring(content.indexOf("export const deleteCustomerFromGoogleSheets = createAsyncThunk("));

const correct = `      // 2. Save updated row
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

`;

fs.writeFileSync("redux/billSlice.ts", beforePart + correct + afterPart);
