import { apiRequest } from "../lib/api";

// Saare orders dekhne ke liye (Staff/Admin only)
export const getAllOrders = (token) => 
  apiRequest("/api/orders", { token });

// Order ka status badalne ke liye
export const updateOrderStatus = (orderId, status, token) => 
  apiRequest("/api/orders/status", { 
    method: "PUT", 
    body: { orderId, status }, 
    token 
  });