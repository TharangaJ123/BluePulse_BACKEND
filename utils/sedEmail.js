// utils/notifications.js
const nodemailer = require('nodemailer');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
      user: 'chathuratharanga076@gmail.com',
      pass: 'tuknfugnynosgohh'
  }
});

// Function to send email
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Check low stock and notify supplier
const checkLowStockAndNotify = async (productId, newQuantity) => {
  const product = await Product.findById(productId).populate('supplier');
  if (!product) throw new Error('Product not found');

  // Define the low stock threshold (e.g., 10)
  const lowStockThreshold = 10;

  if (newQuantity <= lowStockThreshold) {
    const supplier = await Supplier.findById(product.supplier);
    if (!supplier) throw new Error('Supplier not found');

    const subject = `Low Stock Alert: ${product.name}`;
    const text = `Mr.${supplier.name},The stock level for ${product.name} is now ${newQuantity}. Please restock soon.`;

    // Send email to supplier
    await sendEmail(supplier.email, subject, text);
  }
};

module.exports = { checkLowStockAndNotify };