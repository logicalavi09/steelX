import express from "express";
import { createPayment } from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, authorizeRoles("customer"), createPayment);

export default router;
