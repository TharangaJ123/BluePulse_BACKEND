const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    documentType: { type: String, required: true },
    UploadDocuments: { type: String, required: true },
    message: { type: String, required: true },
    transactionType: { type: String },
    amount: { type: Number },
    date: { type: Date, default: Date.now },
    description: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model("Finance", financeSchema);