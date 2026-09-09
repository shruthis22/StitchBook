const fs = require("fs");
let content = fs.readFileSync("redux/billSlice.ts", "utf8");

// Check if the function body is missing
if (!content.includes("BOX_PRODUCTS")) {
  // Find insertion point
  const marker = "export const fetchProductsFromGoogleSheets = createAsyncThunk(\x27billing/fetchProducts\x27,";
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    const insertAt = idx + marker.length;
    const funcBody = `
  async (_, { rejectWithValue }) => {
    try {
      const data = await safeFetch(\`\${GOOGLE_SHEET_API_URL}?type=products\`);
      if (data.status === "error") throw new Error(data.message);
      if (!Array.isArray(data)) throw new Error("Invalid data format: expected array");

      return data.map((p: any) => {
        const BOX_PRODUCTS = ["rex prime", "rex 90", "sun 90"];
        const isBox = BOX_PRODUCTS.includes(String(p.name).toLowerCase().trim());
        return {
          id: String(p.id),
          name: String(p.name),
          price: String(p.price),
          unit: (isBox ? "Box" : "Nos") as "Box" | "Nos"
        };
      }) as Product[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

`;
    content = content.slice(0, insertAt) + funcBody + content.slice(insertAt);
    fs.writeFileSync("redux/billSlice.ts", content);
    console.log("Inserted fetchProductsFromGoogleSheets body");
  } else {
    console.log("Marker not found");
  }
} else {
  console.log("BOX_PRODUCTS already present");
}

