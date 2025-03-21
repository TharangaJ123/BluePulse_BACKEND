const mongoose = require('mongoose');

// Define the User Schema
const employeeSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      maxlength: 255,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 255,
    },
    password_hash: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      maxlength: 20,
      default: null, // Optional field
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'], // ENUM values
      default: 'active', // Default status
    },
    employee_position: {
      type: String,
      maxlength: 100,
      default: null, // Optional field
    },
    user_role: {
      type: String,
      enum: ['admin', 'manager', 'employee', 'guest'], // Example roles
      default: 'employee', // Default role
    },
    created_at: {
      type: Date,
      default: Date.now, // Auto-set to current timestamp
    },
    updated_at: {
      type: Date,
      default: Date.now, // Auto-set to current timestamp
    },
  },
  {
    timestamps: false, // Disable Mongoose's default timestamps
  }
);

// Middleware to update `updated_at` before saving
employeeSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Create the User model
const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;