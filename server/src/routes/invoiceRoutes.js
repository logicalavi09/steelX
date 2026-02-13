import express from "express";
import { generateInvoice } from "../controllers/invoiceController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:orderId", protect, authorizeRoles("admin", "staff", "customer"), generateInvoice);

export default router;
