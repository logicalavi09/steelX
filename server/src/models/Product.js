import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["steel", "aluminium", "custom"],
    required: true,
  },
  unit: {
    type: String, // kg, piece, meter
    default: "piece",
  },
  basePrice: {
    type: Number,
    required: true,
  },
  description: String
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
