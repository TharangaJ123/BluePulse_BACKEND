const express = require("express");
const router = express.Router();
const Commi = require("../models/Commi"); // Ensure correct path
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Set up storage for images
const storage = multer.diskStorage({
  destination: "./uploads/", // Folder to store uploaded photos
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

// Add a Commi with Photo Upload
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    const { pid, email, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null; // File path

    const newCommi = new Commi({ pid, email, photo, description });

    await newCommi.save(); // Save the document to the database
    res.status(201).json({ message: "Commi added successfully", data: newCommi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding Commi", details: err.message });
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
    const { pid, email, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : req.body.photo; // Use existing photo if no new file is uploaded

    const updateCommi = { pid, email, photo, description };

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
  let userId = req.params.id;

  try {
    const commi = await Commi.findById(userId);
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
