import { apiRequest } from "../lib/api";

// Backend se Razorpay Order ID mangwane ke liye
export const initiatePayment = (orderId, token) => 
  apiRequest("/api/payments/create", { 
    method: "POST", 
    body: { orderId }, 
    token 
  });