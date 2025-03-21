const express = require("express");  // Import express
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const Supplier = require('../models/Supplier');
const { checkLowStockAndNotify } = require('../utils/sedEmail'); // Import the function

// Set up storage for images
const storage = multer.diskStorage({
    destination: "./uploads/",  // images uploads folder
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

// Create product with image upload
router.post("/addProduct", upload.single("image"), async (req, res) => {
    try {
        const { name, price, description, category, quantity,supplier } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Save image path

        const newProduct = new Product({
            name,
            price: Number(price),
            description,
            imageUrl,
            category,
            quantity: Number(quantity),
            supplier
        });

        await newProduct.save();

        await checkLowStockAndNotify(newProduct._id, quantity);

        res.json({ message: "Product added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error adding product" });
    }
});

//get products : http://localhost:8070/products/getAllProducts
router.route("/getAllProducts").get((req,res)=>{

    Product.find().then((products)=>{
        res.json(products);
    }).catch((err)=>{
        console.log(err);
    })

})

//update product : http://localhost:8070/products/updateProduct/1
router.route("/updateProduct/:id").put(async(req,res)=>{
    
    let productId = req.params.id;
    const{name,price,description,imageUrl,category,quantity} = req.body;

    const updateProduct = {
        name,
        price,
        description,
        imageUrl,
        category,
        quantity
    }

    const update = await Product.findByIdAndUpdate(productId,updateProduct).then(()=>{
        res.status(200).send({status:"Product updated",updateProduct});
    }).catch((err)=>{
        res.status(500).send({status:"Error with updating data",error:err.message});
    })

});

//delete product : http://localhost:8070/products/deleteProduct/1
router.route("/deleteProduct/:id").delete(async(req,res)=>{

    let productId = req.params.id;

    await Product.findByIdAndDelete(productId).then(()=>{
        res.status(200).send({status:"Product deleted"});   
    }).catch((err)=>{
        console.log(err.message);
        res.status(500).send({status:"Error with deleting data",error:err.message});
    });

})

//get one product by id : http://localhost:8070/products/getProduct/id
router.route("/getProduct/:id").get((req,res)=>{

    let productId = req.params.id;
    Product.findById(productId).then((product)=>{
        res.json(product);
    }).catch((err)=>{
        console.log(err);
    });

});

//update product quantity by product id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const newQuantity = parseInt(quantity);

        const product = await Product.findByIdAndUpdate(
            id,
            {quantity:newQuantity},
            { new: true } // Return updated document
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product quantity updated successfully', product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


//check for low stock
router.put('/:id/quantity', async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
  
      // Find the product
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      // Check for low stock and notify supplier
      await checkLowStockAndNotify(id, quantity);
  
      res.status(200).json({ message: 'Quantity checked successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

module.exports = router;