const mongoose = require('mongoose');

const LeaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid'],
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  usedDays: {
    type: Number,
    default: 0
  },
  remainingDays: {
    type: Number,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LeaveBalanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for employee, year, and leave type
LeaveBalanceSchema.index({ employeeId: 1, year: 1, leaveType: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', LeaveBalanceSchema); 