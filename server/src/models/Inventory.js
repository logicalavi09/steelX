import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export default mongoose.model("Inventory", inventorySchema);
