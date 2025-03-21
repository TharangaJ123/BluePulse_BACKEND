const express = require("express");
const router = express.Router();
const ServiceRequest = require("../models/service");

// CREATE (POST)
router.post("/services", async (req, res) => {
    try {
        const newServiceRequest = new ServiceRequest(req.body);
        await newServiceRequest.save();
        res.status(201).json(newServiceRequest);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// READ (GET)
router.get("/services", async (req, res) => {
    try {
        const services = await ServiceRequest.find();
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE (PUT)
router.put("/services/:id", async (req, res) => {
    try {
        const updatedServiceRequest = await ServiceRequest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedServiceRequest) {
            return res.status(404).json({ error: "Service request not found" });
        }
        res.json(updatedServiceRequest);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE (DELETE)
router.delete("/services/:id", async (req, res) => {
    try {
        const deletedServiceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);
        if (!deletedServiceRequest) {
            return res.status(404).json({ error: "Service request not found" });
        }
        res.json({ message: "Service request deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
