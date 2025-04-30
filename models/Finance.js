const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    documentType: { type:String,required: true },
    UploadDocuments: { type: String, required: true },
    message: { type: String, required: true }
});

module.exports = mongoose.model("Finance", financeSchema);