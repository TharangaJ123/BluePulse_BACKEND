const express = require("express");
const router = express.Router();
const Finance = require("../models/Finance"); // Ensure correct path
const path = require("path");
const multer = require("multer");


// Set up storage for images
const storage = multer.diskStorage({
    destination: "./uploads/",  // images uploads folder
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });


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
      });
  
      await newFinance.save(); // Save the document to the database
      res.status(201).json({ message: "Finance added successfully", data: newFinance });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error adding finance", details: err.message });
    }
  });



router.route("/").get((req,res)=>{
    Finance.find().then((Finances)=>{
        res.json(Finances)
    }).catch((err)=>{
        console.log(err)
    })
})


router.route("/update/:id").put(async (req, res) => {
    try {
        let userId = req.params.id;
        const { Fullname, Email, ContactNumber, documentType, UploadDocuments,uploaddocuments, AdditionalCommants } = req.body;

        const updateFinance = {
            Fullname,
            Email,
            ContactNumber,
            documentType,
            UploadDocuments,
            uploaddocuments,
            AdditionalCommants
        };

        const update = await Finance.findByIdAndUpdate(userId, updateFinance, { new: true });

        if (!update) {
            return res.status(404).send({ status: "User not found" });
        }

        res.status(200).send({ status: "User updated", user: update });

    } catch (err) {
        console.error(err);
        res.status(500).send({ status: "Error updating data", error: err.message });
    }
});




router.route("/delete/:id").delete(async (req,res) =>{
    let userId = req.params.id;

    await Finance.findByIdAndDelete(userId)
    .then(() => {
        res.status(200).send({status: "User deleted"});
    }).catch((err) =>{
        console.log(err.massage);
        res.status(500).send({status: "Error with delet user",error:err.massage});
    })
})

router.route("/get/:id").get(async (requestIdleCallback,res) =>{
    let userId = req.params.id;
    await Finance.findById(userId)
    .then(() =>{
        res.status(200).send({status:"user fetch",user:user})
    }).catch(() =>{
        console.log(err.message);
        res.status(500).send({status:"Error with get user:",error: err.message});
    })
})

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
