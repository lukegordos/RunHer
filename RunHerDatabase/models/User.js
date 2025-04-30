const mongoose = require('mongoose');

// Enable debug mode for mongoose
mongoose.set('debug', true);

const userSchema = new mongoose.Schema({
  // Basic user info
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },

  // Runner profile
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  preferredTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'weekend'],
    default: 'morning'
  },
  location: {
    type: String,
    default: 'Portland, OR'
  },
  pace: {
    type: String,
    default: '10:00 min/mile'
  }
});

// Add pre-save hook for debugging
userSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered for user:', this);
  next();
});

// Add pre-find hook for debugging
userSchema.pre('find', function(next) {
  console.log('Pre-find hook triggered with query:', this.getQuery());
  next();
});

module.exports = mongoose.model('User', userSchema);