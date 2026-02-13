import express from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus
} from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Customer
router.post("/", protect, authorizeRoles("customer"), createOrder);
router.get("/my", protect, authorizeRoles("customer"), getMyOrders);
router.get("/", protect, authorizeRoles("staff", "admin"), getAllOrders);
router.get("/:orderId", protect, getOrderById);

// Staff/Admin
router.put("/status", protect, authorizeRoles("staff", "admin"), updateOrderStatus);

export default router;
