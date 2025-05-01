const express = require("express");
const router = express.Router();
const Finance = require("../models/Finance");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// POST route to add finance data
router.post("/add", upload.single("UploadDocuments"), async (req, res) => {
    try {
        const { fullName, email, contactNumber, documentType, message } = req.body;
        const filePath = req.file ? `/uploads/${req.file.filename}` : null;

        const newFinance = new Finance({
            fullName,
            email,
            contactNumber,
            documentType,
            UploadDocuments: filePath,
            message,
            status: "pending"
        });

        await newFinance.save();
        res.status(201).json({ message: "Finance added successfully", data: newFinance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error adding finance", details: err.message });
    }
});

// GET route to download a file
router.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "Error downloading file" });
            }
        });
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// GET all finances
router.route("/").get((req, res) => {
    Finance.find().then((finances) => {
        res.json(finances);
    }).catch((err) => {
        console.log(err);
        res.status(500).json({ error: "Error fetching finances" });
    });
});

// UPDATE finance
router.route("/update/:id").put(async (req, res) => {
    try {
        let userId = req.params.id;
        const { fullName, email, contactNumber, documentType, message, status } = req.body;

        const updateFinance = {
            fullName,
            email,
            contactNumber,
            documentType,
            message,
            status
        };

        const update = await Finance.findByIdAndUpdate(userId, updateFinance, { new: true });

        if (!update) {
            return res.status(404).send({ status: "Finance record not found" });
        }

        res.status(200).send({ status: "Finance updated", finance: update });

    } catch (err) {
        console.error(err);
        res.status(500).send({ status: "Error updating data", error: err.message });
    }
});

// UPDATE only the status of a finance record
router.route("/update-status/:id").put(async (req, res) => {
    try {
        const financeId = req.params.id;
        const { status } = req.body; // Expects { status: "new_status" }

        if (!status) {
            return res.status(400).json({ error: "Status field is required" });
        }

        const updatedFinance = await Finance.findByIdAndUpdate(
            financeId,
            { $set: { status } }, // Only updates the status field
            { new: true } // Returns the updated document
        );

        if (!updatedFinance) {
            return res.status(404).json({ error: "Finance record not found" });
        }

        res.status(200).json({
            message: "Status updated successfully",
            finance: updatedFinance,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update status", details: err.message });
    }
});

// DELETE finance
router.route("/delete/:id").delete(async (req, res) => {
    let userId = req.params.id;
    await Finance.findByIdAndDelete(userId)
    .then(() => {
        res.status(200).send({status: "Finance record deleted"});
    }).catch((err) => {
        console.log(err.message);
        res.status(500).send({status: "Error deleting record", error: err.message});
    });
});

// GET single finance
router.route("/get/:id").get(async (req, res) => {
    let userId = req.params.id;
    await Finance.findById(userId)
    .then((finance) => {
        res.status(200).send({status: "Finance record fetched", finance: finance});
    }).catch((err) => {
        console.log(err.message);
        res.status(500).send({status: "Error fetching record", error: err.message});
    });
});

// Add finance record
router.route("/add").post((req, res) => {
    const { transactionType, amount, date, description, email } = req.body;

    const newFinance = new Finance({
        transactionType,
        amount,
        date,
        description,
        email
    });

    newFinance.save()
        .then(() => res.json("Finance record added"))
        .catch((err) => res.status(400).json("Error: " + err));
});

// Get all finance records
router.route("/").get((req, res) => {
    Finance.find()
        .then(finances => res.json(finances))
        .catch(err => res.status(400).json("Error: " + err));
});

// Get finance records by email
router.route("/byEmail/:email").get((req, res) => {
    const { email } = req.params;
    Finance.find({ email: email })
        .then(finances => res.json(finances))
        .catch(err => res.status(400).json("Error: " + err));
});

// Get finance record by ID
router.route("/:id").get((req, res) => {
    Finance.findById(req.params.id)
        .then(finance => res.json(finance))
        .catch(err => res.status(400).json("Error: " + err));
});

// Delete finance record
router.route("/:id").delete((req, res) => {
    Finance.findByIdAndDelete(req.params.id)
        .then(() => res.json("Finance record deleted"))
        .catch(err => res.status(400).json("Error: " + err));
});

// Update finance record
router.route("/update/:id").post((req, res) => {
    Finance.findById(req.params.id)
        .then(finance => {
            finance.transactionType = req.body.transactionType;
            finance.amount = req.body.amount;
            finance.date = req.body.date;
            finance.description = req.body.description;
            finance.email = req.body.email;

            finance.save()
                .then(() => res.json("Finance record updated"))
                .catch(err => res.status(400).json("Error: " + err));
        })
        .catch(err => res.status(400).json("Error: " + err));
});

module.exports = router;
