const mongoose = require("mongoose");

const ServiceRequestSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    service: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    additionalNotes: { type: String },
    termsAccepted: { type: Boolean, required: true }
});

const ServiceRequest = mongoose.model("ServiceRequest", ServiceRequestSchema);
module.exports = ServiceRequest;
