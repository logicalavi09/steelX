import Razorpay from "razorpay";
import Order from "../models/Order.js";

// Razorpay initialize
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY || "", 
  key_secret: process.env.RAZORPAY_SECRET || ""
});

export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Debugging ke liye check: Agar key nahi mil rahi toh error return karein console par
    if (!process.env.RAZORPAY_KEY) {
      console.error("RAZORPAY_KEY is missing in .env file");
      return res.status(500).json({ error: "Payment gateway configuration missing" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const payment = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Razorpay accepts amount in paise (integer)
      currency: "INR",
      receipt: `steelx_${orderId}`
    });

    order.paymentId = payment.id;
    await order.save();

    res.json(payment);
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ error: error.message });
  }
};