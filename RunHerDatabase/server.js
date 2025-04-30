const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get frontend URL from environment or use default
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:8080';
console.log('Frontend URL for CORS:', frontendURL);

// Configure CORS for development
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Add OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// Basic middleware for logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Stack trace:', err.stack);
  
  // Handle specific types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate Error',
        details: 'This record already exists'
      });
    }
  }
  
  // Generic error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Profile routes
const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

// Social routes
const socialRoutes = require('./routes/social');
app.use('/api/social', socialRoutes);

// Message routes
const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

// Runs routes
const runsRoutes = require('./routes/runs');
app.use('/api/runs', runsRoutes);

// Test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Check MongoDB connection status
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state !== 1) {
      throw new Error(`MongoDB is ${stateMap[state]}. Please try again in a few seconds.`);
    }

    // Try to get the list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const users = await mongoose.connection.db.collection('users').countDocuments();

    res.json({ 
      status: 'connected',
      state: stateMap[state],
      collections: collections.map(c => c.name),
      userCount: users
    });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ 
      status: 'error',
      message: err.message
    });
  }
});

// MongoDB connection with debug logging
console.log('Attempting MongoDB connection...');

async function connectToMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB connection successful');

    // Add connection event listeners
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Test the connection by listing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Connected to MongoDB. Available collections:', collectionNames);

    // Test user count
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log('Number of users in database:', userCount);

    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}


// Root route to show available endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'RunHer API Server',
    availableEndpoints: {
      health: '/api/health',
      database: '/api/test-db',
      auth: '/api/auth/*',
      social: '/api/social/*',
      runs: '/api/runs/*',
      groups: '/api/groups/*',
      groupRuns: '/api/group-runs/*'
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/social', require('./routes/social'));
app.use('/api/runs', require('./routes/runs'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/group-runs', require('./routes/groupRuns'));
app.use('/api/profile', require('./routes/profile'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Stack trace:', err.stack);
  
  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server after MongoDB connects
const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
async function startServer() {
  try {
    await connectToMongoDB();
    console.log('MongoDB connected successfully');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend URL for CORS: ${process.env.FRONTEND_URL}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();