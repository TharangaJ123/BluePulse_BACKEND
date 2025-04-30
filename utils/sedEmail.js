// utils/notifications.js
const nodemailer = require('nodemailer');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const OrderModel = require('../models/OrderModel');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
      user: 'chathuratharanga076@gmail.com',
      pass: 'tuknfugnynosgohh'
  }
});

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

const checkLowStockAndNotify = async (productId, newQuantity) => {
  const product = await Product.findById(productId).populate('supplier');
  if (!product) throw new Error('Product not found');

  const lowStockThreshold = 10;

  if (newQuantity <= lowStockThreshold) {
    const supplier = await Supplier.findById(product.supplier);
    if (!supplier) throw new Error('Supplier not found');

    const subject = `Low Stock Alert: ${product.name}`;
    const text = `Mr.${supplier.name},The stock level for ${product.name} is now ${newQuantity}. Please restock soon.BluePulse,Gampaha`;

    await sendEmail(supplier.email, subject, text);
  }
};

const sendEmailToCustomerByOrderPlaced = async (orderId, email) => {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new Error('Order not found');

  const subject = `🛒 Your Order #${order._id} Has Been Received – BluePulse`;

  const text = `Hi there,
  
  Thank you for shopping with **BluePulse**! We're excited to let you know that we've received your order **#${order._id}**.
  
  🧾 **Order Details**
  - Order ID: ${order._id}
  - Status: ${order.status}
  - Total Amount: LKR ${order.totalAmount}
  - Transaction ID: ${order.transactionId}
  - Products: ${order.products.map(item => `Product ID: ${item.name}, Quantity: ${item.quantity}`).join('/n')}
  
  We'll notify you as soon as your items are on their way.
  
  If you have any questions or need help, feel free to contact our support team at support@bluepulse.lk.
  
  Thanks again for choosing BluePulse!
  
  Warm regards,  
  **The BluePulse Team**  
  📍 Gampaha | 🌐 www.bluepulse.lk`;
  

  await sendEmail(email, subject, text);
};


module.exports = { checkLowStockAndNotify,sendEmailToCustomerByOrderPlaced };