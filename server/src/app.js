import "dotenv/config"; // Sabse upar load karna zaroori hai
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// HTTP Server (for Socket.IO)
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Database
connectDB();

// Socket Events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinOrderRoom", (orderId) => {
    socket.join(orderId);
    console.log(`User joined room ${orderId}`);
  });

  socket.on("sendMessage", ({ orderId, message, sender }) => {
    io.to(orderId).emit("receiveMessage", {
      message,
      sender,
      time: new Date()
    });
  });

  socket.on("orderStatusUpdate", ({ orderId, status }) => {
    io.to(orderId).emit("statusUpdated", {
      orderId,
      status,
      time: new Date()
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoice", invoiceRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "SteelX Backend Live 🚀 + Realtime" });
});

// Server Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running with HTTP + Socket.IO on port ${PORT}`);
});