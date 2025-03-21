const express = require("express");
const router = express.Router();
const Commi = require("../models/Commi"); // Ensure correct path
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Set up storage for images
const storage = multer.diskStorage({
  destination: "./uploads/",  // images uploads folder
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({ storage: storage });


// POST route to add finance data
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    const { email, location, description } = req.body;

    // Validate required fields
    if (!email || !location || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newCommunity = new Commi({
      email,
      photo: filePath,
      location,
      description,
    });

    await newCommunity.save();
    res.status(201).json({ message: "Post added successfully", data: newCommunity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding post", details: err.message });
  }
});

// Read all Commis
router.get("/getAll", async (req, res) => {
  try {
    const commis = await Commi.find();
    res.json(commis);
  } catch (err) {
    console.log(err);
    res.status(500).send({ status: "Error with fetching commis", error: err.message });
  }
});

// Update a Commi with Photo Upload
router.put("/update/:id", upload.single("photo"), async (req, res) => {
  try {
    let userId = req.params.id;
    const { pid, email, description, location } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : req.body.photo; // Use existing photo if no new file is uploaded

    const updateCommi = { pid, email, photo, description, location };

    const update = await Commi.findByIdAndUpdate(userId, updateCommi, { new: true });

    if (!update) {
      return res.status(404).send({ status: "Commi not found" });
    }

    res.status(200).send({ status: "Commi updated", commi: update });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Error updating data", error: err.message });
  }
});

// Delete a Commi and Its Photo
router.delete("/delete/:id", async (req, res) => {
  let userId = req.params.id;

  try {
    const commi = await Commi.findById(userId);
    if (!commi) {
      return res.status(404).send({ status: "Commi not found" });
    }

    // Delete the photo file from the server
    if (commi.photo) {
      const filePath = path.join(__dirname, "..", commi.photo);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.log("Error deleting file:", err);
        }
      });
    }

    // Delete the Commi from the database
    await Commi.findByIdAndDelete(userId);
    res.status(200).send({ status: "Commi deleted" });
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ status: "Error with deleting Commi", error: err.message });
  }
});

// Get a Commi by ID
router.get("/get/:id", async (req, res) => {
  let id = req.params.id;

  try {
    const commi = await Commi.findById(id);
    if (!commi) {
      return res.status(404).send({ status: "Commi not found" });
    }
    res.status(200).send({ status: "Commi fetched", commi });
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ status: "Error with fetching Commi", error: err.message });
  }
});

module.exports = router;