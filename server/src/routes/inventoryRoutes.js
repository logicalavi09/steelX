import express from "express";
import { updateStock, getInventoryByBranch } from "../controllers/inventoryController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/update", protect, authorizeRoles("staff", "admin"), updateStock);
router.get("/:branchId", protect, getInventoryByBranch);

export default router;
