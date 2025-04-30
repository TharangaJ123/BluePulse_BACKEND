const express = require("express");  // Import express
const router = express.Router();
const Supplier = require("../models/Supplier");

// Create product with image upload
router.post("/addSupplier", async (req, res) => {
    try {
        const { name, email, phone} = req.body;

        const newSupplier = new Supplier({
            name,
            email,
            phone
        });

        await newSupplier.save();
        res.json({ message: "Supplier added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error adding Supplier" });
    }
});

//get products : http://localhost:8070/products/getAllProducts
router.route("/getAllSuppliers").get((req,res)=>{

    Supplier.find().then((supplier)=>{
        res.json(supplier);
    }).catch((err)=>{
        console.log(err);
    })

})

// Get a single supplier by ID
router.get('/:id', async (req, res) => {
    try {
      const supplier = await Supplier.findById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      res.status(200).json(supplier);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a supplier
  router.put('/:id', async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      const supplier = await Supplier.findByIdAndUpdate(
        req.params.id,
        { name, email, phone },
        { new: true }
      );
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      res.status(200).json(supplier);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a supplier
  router.delete('/:id', async (req, res) => {
    try {
      const supplier = await Supplier.findByIdAndDelete(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
module.exports = router;