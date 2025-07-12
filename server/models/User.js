const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  profilePhoto: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  skillsOffered: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  skillsWanted: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  availability: [{
    type: String,
    enum: ['Weekdays', 'Weekends', 'Evenings', 'Mornings'],
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 5.0,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  ratingSum: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search functionality
userSchema.index({ 
  name: 'text', 
  skillsOffered: 'text', 
  skillsWanted: 'text',
  location: 'text'
});

userSchema.index({ email: 1 });
userSchema.index({ isPublic: 1, isBanned: 1 });
userSchema.index({ skillsOffered: 1 });
userSchema.index({ skillsWanted: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update rating method
userSchema.methods.updateRating = function(newRating) {
  this.ratingSum += newRating;
  this.totalRatings += 1;
  this.rating = Math.round((this.ratingSum / this.totalRatings) * 10) / 10;
  return this.save();
};

// Get public profile method
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.ratingSum;
  delete userObject.totalRatings;
  return userObject;
};

// Virtual for completed swaps count
userSchema.virtual('completedSwaps', {
  ref: 'SwapRequest',
  localField: '_id',
  foreignField: 'participants',
  match: { status: 'completed' },
  count: true
});

module.exports = mongoose.model('User', userSchema);