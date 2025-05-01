const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AttachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  comments: [CommentSchema],
  attachments: [AttachmentSchema],
  notifications: [{
    type: {
      type: String,
      enum: ['reminder', 'status_change', 'comment', 'attachment'],
      required: true
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  analytics: {
    timeSpent: {
      type: Number,
      default: 0
    },
    completionTime: Date,
    statusHistory: [{
      status: String,
      changedAt: Date,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add method to update status with history
TaskSchema.methods.updateStatus = function(newStatus, changedBy) {
  this.status = newStatus;
  this.analytics.statusHistory.push({
    status: newStatus,
    changedAt: Date.now(),
    changedBy: changedBy
  });
  
  // Add notification for status change
  this.notifications.push({
    type: 'status_change',
    message: `Task status changed to ${newStatus}`,
    createdAt: Date.now()
  });
};

// Add method to add comment
TaskSchema.methods.addComment = function(content, author) {
  this.comments.push({
    content,
    author,
    createdAt: Date.now()
  });
  
  // Add notification for new comment
  this.notifications.push({
    type: 'comment',
    message: 'New comment added to task',
    createdAt: Date.now()
  });
};

// Add method to add attachment
TaskSchema.methods.addAttachment = function(attachmentData) {
  this.attachments.push({
    ...attachmentData,
    uploadedAt: Date.now()
  });
  
  // Add notification for new attachment
  this.notifications.push({
    type: 'attachment',
    message: 'New attachment added to task',
    createdAt: Date.now()
  });
};

// Add method to mark task as complete
TaskSchema.methods.markComplete = function(completedBy) {
  this.status = 'completed';
  this.analytics.completionTime = Date.now();
  this.analytics.statusHistory.push({
    status: 'completed',
    changedAt: Date.now(),
    changedBy: completedBy
  });
  
  // Add notification for completion
  this.notifications.push({
    type: 'status_change',
    message: 'Task marked as completed',
    createdAt: Date.now()
  });
};

// Static method to get task analytics
TaskSchema.statics.getAnalytics = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompletionTime: {
          $avg: {
            $subtract: ['$analytics.completionTime', '$createdAt']
          }
        }
      }
    }
  ]);
};

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task; 