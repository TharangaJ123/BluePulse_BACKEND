// models/Contact.js
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Name is required
  },
  email: {
    type: String,
    required: true, // Email is required
  },
  message: {
    type: String,
    required: true, // Message is required
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
});

// Create the Contact model
const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;