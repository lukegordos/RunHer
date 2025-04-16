const mongoose = require('mongoose');

const runningGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  meetingTimes: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    time: String, // "HH:mm" format
    type: {
      type: String,
      enum: ['regular', 'occasional', 'one-time']
    },
    date: Date // Only for one-time meetings
  }],
  paceRange: {
    min: Number, // minutes per mile
    max: Number
  },
  distanceRange: {
    min: Number, // miles
    max: Number
  },
  tags: [String], // e.g., ['beginners', 'trail-running', 'marathon-training']
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxMembers: {
    type: Number,
    default: 50
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
runningGroupSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('runningGroups', runningGroupSchema);
