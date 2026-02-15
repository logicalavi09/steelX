import User from "../models/User.js";
import generateOTP from "../utils/generateOTP.js";
import jwt from "jsonwebtoken";

export const sendOTP = async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone is required" });

    let user = await User.findOne({ phone });
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    if (!user) {
      // Development ke liye naya user hamesha admin banega
      user = await User.create({ name, phone, otp, otpExpiry, role: "admin" });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    }

    console.log(`[AUTH] OTP for ${phone}: ${otp}`);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });

    if (!user || user.otp !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP Verify hone par verified mark karo
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};