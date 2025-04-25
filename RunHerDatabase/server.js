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


// Configure CORS - Development configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: true
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



// Test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    if (!dbConnected) {
      throw new Error('MongoDB is not connected yet. Please try again in a few seconds.');
    }
    // Try to get the list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ 
      status: 'connected',
      collections: collections.map(c => c.name)
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

let dbConnected = false;

async function connectToMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    console.log('Attempting to connect with options:', options);
    
    try {
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('MongoDB connection successful');

      // Ensure collections exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log('Existing collections:', collectionNames);

      // Create collections if they don't exist
      if (!collectionNames.includes('runnerprofiles')) {
        console.log('Creating runnerprofiles collection...');
        await mongoose.connection.db.createCollection('runnerprofiles');
        console.log('Created runnerprofiles collection');
      }

      // Create indexes
      const RunnerProfile = require('./models/RunnerProfile');
      await RunnerProfile.collection.createIndex({ user: 1 }, { unique: true });
      await RunnerProfile.collection.createIndex({ location: '2dsphere' });
      console.log('Indexes created for runnerprofiles collection');
      console.log('Connected to MongoDB successfully');
      return collections;
    } catch (error) {
      console.error('MongoDB connection error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        codeName: error.codeName
      });
      throw error;
    }
    const collections = await connectToMongoDB();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test user creation
    const User = require('./models/User');
    try {
      const testUser = new User({
        name: 'Test User',
        email: 'test' + Date.now() + '@test.com',
        password: 'password123'
      });
      console.log('Attempting to save test user...');
      await testUser.save();
      console.log('Test user saved successfully with id:', testUser._id);
      
      // Verify user was saved
      const foundUser = await User.findById(testUser._id);
      console.log('Found test user in database:', foundUser ? 'Yes' : 'No');
      
      if (foundUser) {
        // Clean up test user
        await User.deleteOne({ _id: testUser._id });
        console.log('Test user deleted');
      }
    } catch (testError) {
      console.error('Test user creation failed:', testError);
    }
    
    dbConnected = true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
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
      console.log(`Test the server: http://localhost:${PORT}/api/health`);
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