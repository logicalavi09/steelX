import express from "express";
import { createProduct, getProducts } from "../controllers/productController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin check laga hua hai
router.post("/", protect, authorizeRoles("admin"), createProduct);
router.get("/", protect, getProducts);

export default router;