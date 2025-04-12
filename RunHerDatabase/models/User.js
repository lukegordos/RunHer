const mongoose = require('mongoose');

// Enable debug mode for mongoose
mongoose.set('debug', true);

const userSchema = new mongoose.Schema({
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
  }
});

// Add pre-save hook for debugging
userSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered for user:', this);
  next();
});

module.exports = mongoose.model('users', userSchema);