const mongoose = require('mongoose');

const groupRunSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'runningGroups',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // "HH:mm" format
    required: true
  },
  meetingPoint: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      required: true
    },
    coordinates: [[Number]] // Array of [longitude, latitude] pairs
  },
  distance: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['miles', 'kilometers'],
      default: 'miles'
    }
  },
  pace: {
    min: Number, // minutes per mile
    max: Number
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not-going'],
      default: 'going'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxParticipants: Number,
  weather: {
    temperature: Number,
    condition: String,
    windSpeed: Number,
    precipitation: Number
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  safetyFeatures: {
    buddySystem: {
      type: Boolean,
      default: true
    },
    emergencyContacts: [{
      name: String,
      phone: String,
      notified: {
        type: Boolean,
        default: false
      }
    }],
    trackingEnabled: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Create geospatial index for meeting point
groupRunSchema.index({ meetingPoint: '2dsphere' });

module.exports = mongoose.model('groupRuns', groupRunSchema);
