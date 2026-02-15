import express from "express";
import { createOrder, getAllOrders, getMyOrders, getOrderById, updateOrderStatus } from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Order dene ki permission Admin ko bhi de di
router.post("/", protect, authorizeRoles("customer", "admin"), createOrder);

// Admin bhi apni order history dekh sake
router.get("/my", protect, authorizeRoles("customer", "admin"), getMyOrders);

// Staff/Admin saare orders dekh sakein
router.get("/", protect, authorizeRoles("staff", "admin"), getAllOrders);

router.get("/:orderId", protect, getOrderById);
router.put("/status", protect, authorizeRoles("staff", "admin"), updateOrderStatus);

export default router;