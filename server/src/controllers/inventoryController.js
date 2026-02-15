import Inventory from "../models/Inventory.js";

export const updateStock = async (req, res) => {
  try {
    const { branchId, productId, stock } = req.body;

    // Check if inventory entry exists
    let inventory = await Inventory.findOne({
      branch: branchId,
      product: productId
    });

    if (!inventory) {
      // Naya stock entry
      inventory = await Inventory.create({
        branch: branchId,
        product: productId,
        stock: Number(stock)
      });
    } else {
      // Purana stock update
      inventory.stock = Number(stock);
      await inventory.save();
    }

    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getInventoryByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const inventory = await Inventory.find({ branch: branchId })
      .populate("product", "name category unit basePrice");

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};