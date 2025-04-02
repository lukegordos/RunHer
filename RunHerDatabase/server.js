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
app.use(cors());

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\nPossible solutions:');
      console.error('1. Check if your IP is whitelisted in MongoDB Atlas');
      console.error('2. Verify your MongoDB URI is correct');
      console.error('3. Make sure your MongoDB cluster is running');
    }
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/password', require('./routes/reset'));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Send appropriate error message
  if (err.name === 'MongooseServerSelectionError') {
    res.status(500).json({ 
      error: 'Database connection error. Please try again later.',
      details: 'The server cannot connect to the database. This might be temporary.'
    });
  } else {
    res.status(500).json({ 
      error: err.message || 'An unexpected error occurred'
    });
  }
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});