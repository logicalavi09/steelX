import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import Order from "../models/Order.js";

export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("customer", "name phone")
      .populate("branch", "name address phone")
      .populate("items.product", "name unit");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=invoice_${orderId}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text("STEELX PRO INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice ID: ${order._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.text(`Customer: ${order.customer.name}`);
    doc.text(`Phone: ${order.customer.phone}`);
    doc.moveDown();

    doc.text(`Branch: ${order.branch.name}`);
    doc.text(`Address: ${order.branch.address}`);
    doc.moveDown();

    doc.text("Items:");
    doc.moveDown();

    order.items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.product.name} | Qty: ${item.quantity} | Price: ₹${item.price}`
      );
    });

    doc.moveDown();
    const gst = (order.totalAmount * 0.18).toFixed(2);
    const grandTotal = (order.totalAmount + parseFloat(gst)).toFixed(2);

    doc.text(`Subtotal: ₹${order.totalAmount}`);
    doc.text(`GST (18%): ₹${gst}`);
    doc.fontSize(14).text(`Grand Total: ₹${grandTotal}`);

    doc.moveDown(2);

    const qrData = `https://steelx.local/order/${order._id}`;
    const qrImage = await QRCode.toBuffer(qrData);

    doc.image(qrImage, { width: 100 });
    doc.text("Scan to Track Order");

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
