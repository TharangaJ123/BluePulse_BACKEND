const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
});

const GoalSchema = new mongoose.Schema({
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: { type: Date },
  completedDate: { type: Date }
});

const PerformanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  ratings: {
    overall: { type: Number, min: 1, max: 5 },
    skills: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 }
  },
  goals: [GoalSchema],
  reviews: [ReviewSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PerformanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Performance', PerformanceSchema); 