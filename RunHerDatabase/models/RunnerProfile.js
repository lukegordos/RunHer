const mongoose = require('mongoose');

const runnerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  averagePace: {
    type: Number,  // in minutes per mile
    default: 0
  },
  weeklyMileage: {
    type: Number,
    default: 0
  },
  personalBests: {
    mile: { type: Number },       // time in seconds
    fiveK: { type: Number },      // time in seconds
    tenK: { type: Number },       // time in seconds
    halfMarathon: { type: Number },// time in seconds
    marathon: { type: Number }     // time in seconds
  },
  totalMilesRun: {
    type: Number,
    default: 0
  },
  preferredRunningTime: {
    type: String,
    enum: ['early_morning', 'morning', 'afternoon', 'evening', 'night'],
    default: 'morning'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      default: [0, 0]
    }
  },
  availableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  goals: [{
    type: String,
    trim: true
  }],
  achievements: [{
    name: String,
    date: Date,
    description: String
  }]
}, {
  timestamps: true
});

// Create a geospatial index for location-based queries
runnerProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('runnerProfiles', runnerProfileSchema);
