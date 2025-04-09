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

// Configure CORS - IMPORTANT: This must come before routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});



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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Test the connection by listing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Connected to MongoDB successfully');
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

// Connect to MongoDB before starting the server
connectToMongoDB();

// Root route to show available endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'RunHer API Server',
    availableEndpoints: {
      health: '/api/health',
      database: '/api/test-db',
      auth: '/api/auth/*',
      social: '/api/social/*'
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/social', require('./routes/social'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});