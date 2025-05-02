const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    documentType: { type: String, required: true },
    UploadDocuments: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Finance", financeSchema);