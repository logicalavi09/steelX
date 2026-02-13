import express from "express";
import { createBranch, getBranches } from "../controllers/branchController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("admin"), createBranch);
router.get("/", protect, getBranches);

export default router;
