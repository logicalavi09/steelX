import express from "express";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Any logged-in user
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "User Profile Accessed ✅",
    user: req.user,
  });
});

// Only Admin
router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.json({
    message: "Admin Panel Access Granted 👑",
  });
});

// Staff + Admin
router.get("/staff", protect, authorizeRoles("staff", "admin"), (req, res) => {
  res.json({
    message: "Staff Dashboard Access Granted 👷",
  });
});

export default router;
