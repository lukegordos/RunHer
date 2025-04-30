const mongoose = require('mongoose');

const runSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  meetingPoint: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
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
  duration: {
    type: Number,  // in seconds
    required: true
  },
  pace: {
    type: Number,  // calculated field: minutes per mile/km
    required: true
  },
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: [[Number]]  // array of [longitude, latitude] points
  },
  weather: {
    temperature: Number,
    conditions: String,
    humidity: Number
  },
  type: {
    type: String,
    enum: ['solo', 'group', 'race', 'training'],
    default: 'solo'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  confirmed: {
    type: Boolean,
    default: false,
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  notes: String,
  feelingRating: {
    type: Number,
    min: 1,
    max: 5
  },
  elevationGain: Number,  // in feet
  averageHeartRate: Number
}, {
  timestamps: true
});

// Create a geospatial index for route-based queries
runSchema.index({ route: '2dsphere' });

// Calculate pace before saving
runSchema.pre('save', function(next) {
  // Only calculate pace if it's not already set and we have distance and duration
  if (!this.pace && this.distance?.value > 0 && this.duration > 0) {
    this.pace = this.duration / 60 / this.distance.value;  // minutes per mile/km
  }
  next();
});

module.exports = mongoose.model('runs', runSchema);
