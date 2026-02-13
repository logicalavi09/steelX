import Inventory from "../models/Inventory.js";

export const updateStock = async (req, res) => {
  try {
    const { branchId, productId, stock } = req.body;

    let inventory = await Inventory.findOne({
      branch: branchId,
      product: productId
    });

    if (!inventory) {
      inventory = await Inventory.create({
        branch: branchId,
        product: productId,
        stock
      });
    } else {
      inventory.stock = stock;
      await inventory.save();
    }

    res.json(inventory);
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
