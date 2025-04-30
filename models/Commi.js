const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commiSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  }
});

const Commi = mongoose.model("Commi", commiSchema);

module.exports = Commi;