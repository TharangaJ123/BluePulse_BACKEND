const express = require("express");
const router = express.Router();
const ServiceRequest = require("../models/service");

// ... existing code ...

// Get service requests by email
router.get("/byEmail/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const serviceRequests = await ServiceRequest.find({ email: email });
    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests by email:", error);
    res.status(500).json({ message: "Error fetching service requests", error: error.message });
  }
});

module.exports = router; 