const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required']
  },
  skillOffered: {
    type: String,
    required: [true, 'Skill offered is required'],
    trim: true,
    maxlength: [100, 'Skill offered cannot exceed 100 characters']
  },
  skillWanted: {
    type: String,
    required: [true, 'Skill wanted is required'],
    trim: true,
    maxlength: [100, 'Skill wanted cannot exceed 100 characters']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  },
  completedAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ receiver: 1, status: 1 });
swapRequestSchema.index({ status: 1, createdAt: -1 });
swapRequestSchema.index({ requester: 1, receiver: 1 });

// Prevent duplicate requests
swapRequestSchema.index(
  { requester: 1, receiver: 1, skillOffered: 1, skillWanted: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } }
  }
);

// Virtual for participants (for easier querying)
swapRequestSchema.virtual('participants').get(function() {
  return [this.requester, this.receiver];
});

// Pre-save middleware to set completion date
swapRequestSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'accepted':
        if (!this.acceptedAt) this.acceptedAt = now;
        break;
      case 'rejected':
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
      case 'completed':
        if (!this.completedAt) this.completedAt = now;
        break;
    }
  }
  next();
});

// Static method to get user's swap statistics
swapRequestSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { requester: mongoose.Types.ObjectId(userId) },
          { receiver: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

module.exports = mongoose.model('SwapRequest', swapRequestSchema);