import express from "express";
import { createProduct, getProducts } from "../controllers/productController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("admin"), createProduct);
router.get("/", protect, getProducts);

export default router;
