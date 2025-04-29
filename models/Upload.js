const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['image', 'video', 'document', 'other']
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'public'
  }
}, {
  timestamps: true
});

const Upload = mongoose.model('Upload', uploadSchema);

module.exports = Upload; 