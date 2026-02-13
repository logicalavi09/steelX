import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
  },

  role: {
    type: String,
    enum: ["customer", "staff", "admin"],
    default: "customer",
  },

  otp: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  isVerified: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
