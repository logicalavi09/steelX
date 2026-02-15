import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import Order from "../models/Order.js";

export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if orderId is valid
    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const order = await Order.findById(orderId)
      .populate("customer", "name phone")
      .populate("branch", "name address phone")
      .populate("items.product", "name unit");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // FIX: Content-Disposition 'attachment' se file download hogi, 'inline' se browser mein khulegi
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice_${orderId}.pdf`);

    doc.pipe(res);

    doc.fontSize(24).text("STEELX PRO", { align: "center", characterSpacing: 2 });
    doc.fontSize(10).text("OFFICIAL TAX INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(10).text(`Invoice ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(12).text("BILL TO:", { underline: true });
    doc.fontSize(10).text(`Customer: ${order.customer?.name || 'N/A'}`);
    doc.text(`Phone: ${order.customer?.phone || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(12).text("DISPATCH FROM:", { underline: true });
    doc.fontSize(10).text(`Branch: ${order.branch?.name || 'Main Center'}`);
    doc.text(`Address: ${order.branch?.address || 'N/A'}`);
    doc.moveDown();

    doc.text("--------------------------------------------------------------------------------------------------");
    doc.text("ITEM DESCRIPTION | QTY | PRICE", { bold: true });
    doc.text("--------------------------------------------------------------------------------------------------");
    
    order.items.forEach((item, index) => {
      const productName = item.product?.name || "Unknown Product";
      doc.text(
        `${index + 1}. ${productName} | ${item.quantity} ${item.product?.unit || ''} | ₹${item.price}`
      );
    });
    doc.text("--------------------------------------------------------------------------------------------------");

    doc.moveDown();
    const gst = (order.totalAmount * 0.18).toFixed(2);
    const grandTotal = (order.totalAmount + parseFloat(gst)).toFixed(2);

    doc.fontSize(10).text(`Subtotal: ₹${order.totalAmount}`);
    doc.text(`GST (18%): ₹${gst}`);
    doc.fontSize(14).text(`Grand Total: ₹${grandTotal}`, { bold: true });

    doc.moveDown(2);

    // QR Code logic
    const qrData = `https://steelx.pro/track/${order._id}`;
    const qrImage = await QRCode.toBuffer(qrData);

    doc.image(qrImage, { width: 80 });
    doc.fontSize(8).text("Scan to Track Shipment", { indent: 10 });

    doc.end();
  } catch (error) {
    console.error("PDF Gen Error:", error);
    // Error aane par JSON response bhejein
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating PDF: " + error.message });
    }
  }
};