import Order from "../models/Order.js";
import Product from "../models/Product.js";
import assignBranch from "../utils/assignBranch.js";

export const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    let total = 0;
    const populatedItems = [];

    for (let item of items) {
      if (!item?.productId || !item?.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Invalid order item" });
      }
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const price = product.basePrice * item.quantity;
      total += price;

      populatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price
      });
    }

    const branch = await assignBranch();
    if (!branch) {
      return res.status(400).json({ message: "No branches available" });
    }

    const order = await Order.create({
      customer: req.user._id,
      branch: branch._id,
      items: populatedItems,
      totalAmount: total
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("items.product", "name unit")
      .populate("branch", "name address");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name phone")
      .populate("items.product", "name unit basePrice")
      .populate("branch", "name address");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("customer", "name phone")
      .populate("items.product", "name unit basePrice")
      .populate("branch", "name address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      req.user.role === "customer" &&
      order.customer?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
