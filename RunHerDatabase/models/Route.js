const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  location: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  elevation: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Challenging'],
    required: true
  },
  terrain: {
    type: String,
    enum: ['Road', 'Trail', 'Track', 'Mixed'],
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  imageUrl: String,
  safetyScore: {
    type: Number,
    min: 0,
    max: 5
  },
  safetyDetails: {
    score: Number,
    predictionDetails: {
      explanation: String
    },
    crimeFactors: {
      crimeCount: Number,
      severityCounts: {
        high: Number,
        medium: Number,
        low: Number
      }
    },
    newsFactors: {
      impact: Number
    }
  },
  points: {
    type: [[Number]], // Array of [latitude, longitude] pairs
    required: true
  },
  isGenerated: {
    type: Boolean,
    default: false
  },
  color: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add 2dsphere index for geospatial queries
routeSchema.index({ points: '2dsphere' });

module.exports = mongoose.model('Route', routeSchema);
