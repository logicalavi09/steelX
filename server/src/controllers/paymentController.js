import Razorpay from "razorpay";
import Order from "../models/Order.js";

export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Order ID missing" });

    // Ensure instance is created with current ENV keys
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET
    });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // --- RAZORPAY LIMIT CHECK ---
    // Razorpay max limit is usually 5-10 Lakhs. 2 Crore will fail.
    const amountInPaise = Math.round(order.totalAmount * 100);
    
    if (amountInPaise > 100000000) { // 10 Lakhs check
        return res.status(400).json({ 
            error: "Amount exceeds Razorpay limit. Please test with a smaller amount (less than 10 Lakhs)." 
        });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${order._id.toString().slice(-6)}`
    };

    const payment = await razorpay.orders.create(options);

    order.paymentId = payment.id;
    await order.save();

    res.json({
      ...payment,
      key: process.env.RAZORPAY_KEY
    });

  } catch (error) {
    console.error("RAZORPAY ERROR DETAILS:", error); // Terminal check karo error ke liye
    res.status(500).json({ 
        error: "Razorpay Error: " + (error.description || error.message || "Unknown Error") 
    });
  }
};