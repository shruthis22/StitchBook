# Isaii Billsuite app

A robust, offline-capable mobile billing application designed for Vehicle Service Centers. Built with Expo (React Native), it leverages Google Sheets as a zero-cost, real-time backend database and utilizes Redux Toolkit for efficient state management.


### Project Structure

```
app/
   ->index.tsx
   ->_layout.tsx
   (drawer)/
      ->_layout.tsx
      add/
         ->_layout.tsx
         ->index.tsx
      history/
         ->_layout.tsx
         ->[id].tsx
         ->index.tsx
      home/
         ->index.tsx
         ->_layout.tsx
redux/
   ->store.ts
   ->billSLice.ts

utils/
   ->printBills.ts
   ->shareBill.ts
   

```



## Key Features

1. Service & Product Management: Separate handling for physical products (parts) and labour charges.

2. Google Sheets Sync: Real-time fetching and saving of inventory and invoices using a custom Google Apps Script API.

3. Professional Invoicing: Generates HTML-based invoices with:

4. Automatic "Number to Words" conversion.

5. Watermarked backgrounds.

6. Tax/Discount calculations. (not used)

7. Separated tables for Parts vs. Labour.

8. PDF Printing & Sharing: Seamless integration with native print drivers via expo-print.

9. Navigation: Drawer-based navigation for easy access to History, New Bill, and Home.


## Tech Stack

Framework: Expo (React Native)

Language: TypeScript

Routing: Expo Router (File-based routing)

State Management: Redux Toolkit (RTK)

Backend: Google Apps Script (Serverless) + Google Sheets

PDF Generation: expo-print with custom HTML/CSS


## Setup & Installation

1. Clone the repository

```
git clone [https://github.com/your-username/isaii-billsuite.git](https://github.com/your-username/isaii-billsuite.git)
cd isaii-billsuite
```

2. Install dependencies
```
npm install
```

3. Configure Environment
```
Open redux/billSlice.ts and ensure the GOOGLE_SHEET_API_URL is pointing to your deployed web app.

const GOOGLE_SHEET_API_URL = "YOUR_APPS_SCRIPT_DEPLOYMENT_URL";

```


4. Run the App
```
npx expo start
```



## Backend Architecture (Google Sheets)

*  The app communicates with a Google Sheet via a doGet and doPost Apps Script architecture.

* Data Schema

  * The Redux Slice expects data in the following interfaces:

  * Product Object

```
interface Product {
  id: string;
  name: string;
  price: string;
}


Bill Object

interface Bill {
  id: string;
  customerName: string;
  vehicleNumber: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: BillItem[]; // Mixed array of Product/Labour
  grandTotal: number;
  // ... other fields
}

```

### API Endpoints

| Method | Query/Body | Description |
| :--- | :--- | :--- |
| **GET** | `?type=products` | Fetches list of available spare parts. |
| **GET** | `?type=bills` | Fetches bill history. |
| **POST** | `{ ...data, _sheetType: 'products' }` | Adds a new product to inventory. |
| **POST** | `{ ...data, _sheetType: 'bills' }` | Saves a new invoice. |


### PDF Generation Logic

* Located in utils/printBills.ts, the app constructs a raw HTML string utilizing CSS Grid and Flexbox to create a responsive, printable layout.

* Watermark: Implemented using absolute positioning with pointer-events: none and z-index management to ensure it stays visible but unobtrusive.

* Dynamic Tables: The logic automatically splits items into "Spare Parts" and "Labour Charges" sections within the invoice table.



