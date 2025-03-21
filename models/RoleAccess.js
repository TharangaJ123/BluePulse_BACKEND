// models/RoleAccess.js
const mongoose = require('mongoose');

const RoleAccessSchema = new mongoose.Schema({
  role_id: {
    type: Number,
    required: true,
    unique: true,
  },
  role_name: {
    type: String,
    required: true,
  },
  accessible_sections: {
    type: [String], // Array of accessible sections
    required: true,
  },
});

module.exports = mongoose.model('RoleAccess', RoleAccessSchema);