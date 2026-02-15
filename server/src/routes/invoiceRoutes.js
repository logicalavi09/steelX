import express from "express";
import { updateStock, getInventoryByBranch } from "../controllers/inventoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Stock update sirf Admin ya Staff kar sakta hai
router.post("/update", protect, authorizeRoles("admin", "staff"), updateStock);

// Kisi specific branch ka inventory dekhna
router.get("/:branchId", protect, getInventoryByBranch);

export default router;