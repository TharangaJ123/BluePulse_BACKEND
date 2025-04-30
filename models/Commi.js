

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true }); // Ensure comments have their own IDs


const CommiSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address']
  },
  photo: {
    type: String,
    default: null
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
CommiSchema.index({ email: 1 });
CommiSchema.index({ createdAt: -1 });

// Middleware to delete associated photo when post is removed
CommiSchema.pre('remove', async function(next) {
  if (this.photo) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', this.photo);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting photo file:', err);
    }
  }
  next();
});

module.exports = mongoose.model('Commi', CommiSchema);