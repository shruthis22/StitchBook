// api.ts
// Replace with the Google Apps Script Web App URL once deployed
export const GAS_URL = "https://script.google.com/macros/s/AKfycby1DDrD34pHgzlUn118hkSG7RyU4G2chia4AQMBR0rMAW1_k4yUsyl5u_YO6ynao9yjag/exec";

export const fetchCustomers = async () => {
  const response = await fetch(`${GAS_URL}?type=customers`);
  return response.json();
};

export const fetchOrders = async () => {
  const response = await fetch(`${GAS_URL}?type=orders`);
  return response.json();
};

export const fetchPayments = async () => {
  const response = await fetch(`${GAS_URL}?type=payments`);
  return response.json();
};

export const createCustomer = async (data: any) => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'create_customer', ...data }),
  });
  return response.json();
};

export const createOrder = async (data: any) => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'create_order', ...data }),
  });
  return response.json();
};

export const addPayment = async (data: any) => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'add_payment', ...data }),
  });
  return response.json();
};

export const uploadPhoto = async (base64Data: string, filename: string, orderId: string) => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'upload_photo',
      base64: base64Data,
      filename,
      order_id: orderId,
    }),
  });
  return response.json();
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'update_order_status',
      order_id: orderId,
      status: status,
    }),
  });
  return response.json();
};

export const deleteOrder = async (orderId: string) => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete_order',
      order_id: orderId
    }),
  });
  return response.json();
};
