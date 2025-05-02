const express = require("express");
const router = express.Router();
const Order = require("../models/OrderModel")
const Finance = require("../models/Finance")
const Product = require("../models/Product")
const { sendEmailToCustomerByOrderPlaced,sendEmailToCustomerByOrderApproved,sendEmailToCustomerByOrderCancelled } = require('../utils/sedEmail');

router.post("/createOrder",async(req , res)=>{
    try{
        const { cartItems,transactionId,email } = req.body;
        let totalAmount = 0;
        const orderedProducts = [];

        for(let item of cartItems){
            const product = await Product.findById(item.id);
            if(!product)
                return res.status(404).json({message:"Product not found"});

            totalAmount += product.price*item.quantity;

            orderedProducts.push({
                product:product._id,
                productName:product.name,
                quantity:item.quantity
            })
        }

        const order = new Order({
            email,
            products:orderedProducts,
            totalAmount,
            transactionId
        })

        const savedOrder = await order.save();

        //send email to user
        await sendEmailToCustomerByOrderPlaced(savedOrder._id, email);

        res.status(201).json(order);

    }catch(error){
        res.status(500).json({error:error.message});
    }
})

router.get("/allOrders", async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/updateStatus/:id", async (req, res) => {
    const { status,message } = req.body;
    console.log("Message:", message);
    
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
  
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (status === "Completed") {
        try {
            await sendEmailToCustomerByOrderApproved(order._id, order.email); 
        } catch (emailError) {
          console.error("Email failed:", emailError);
        }
      }

      if (status === "Cancelled") {
        try {
            await sendEmailToCustomerByOrderCancelled(order._id, order.email,message); 
        } catch (emailError) {
          console.error("Email failed:", emailError);
        }
      }
  
      res.status(200).json(order);
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Database update failed" });
    }
});

router.delete("/deleteOrder/:id", async (req, res) => {
    try {
      await Order.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});


module.exports = router;