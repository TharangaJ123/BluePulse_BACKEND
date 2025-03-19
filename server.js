const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const app =express();
const path = require("path");
const cron = require('node-cron');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const { checkLowStockAndNotify } = require('./utils/sedEmail.js'); // Import the function
const productRoutes = require('./routes/Products');

require('dotenv').config();

const PORT = process.env.PORT || 8070;

app.use(cors());
app.use(bodyParser.json());

const URL = process.env.MONGODB_URL;

mongoose.connect(URL,{

    useNewUrlParser:true,
    useUnifiedTopology:true,

});

const connection = mongoose.connection;

connection.once('open',()=>{
    console.log("MOngoDB connection is successfull");
});

const productRouter = require("./routes/Products.js");
app.use("/products", productRouter);

const supplierRouter = require("./routes/Suppliers.js");
app.use("/suppliers", supplierRouter);

// Schedule a cron job to run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Checking for low stock products...');

  const products = await Product.find().populate('supplier');
  for (const product of products) {
    if (product.quantity <= 10) { // Check if quantity is less than or equal to 10
      await checkLowStockAndNotify(product._id, product.quantity);
    }
  }
});

app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

app.listen(PORT,()=>{
    console.log(`Server is up and running on port number: ${PORT}`);
})