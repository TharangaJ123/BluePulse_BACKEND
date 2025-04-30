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
  
      const savedTransaction = await newFinance.save(); // Save the document to the database
      res.status(201).json({ message: "Finance added successfully", data: newFinance,_id:savedTransaction._id });
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

module.exports = router;
