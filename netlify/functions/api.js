const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();

// Validate critical environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
}

// Import route handlers (with error handling)
let authRouter, usersRouter, routesRouter, runsRouter, messagesRouter, socialRouter, resetRouter, profileRouter, groupsRouter, groupRunsRouter;

try {
  authRouter = require('../../RunHerDatabase/routes/auth');
  usersRouter = require('../../RunHerDatabase/routes/users');
  routesRouter = require('../../RunHerDatabase/routes/routes');
  runsRouter = require('../../RunHerDatabase/routes/runs');
  messagesRouter = require('../../RunHerDatabase/routes/messages');
  socialRouter = require('../../RunHerDatabase/routes/social');
  resetRouter = require('../../RunHerDatabase/routes/reset');
  profileRouter = require('../../RunHerDatabase/routes/profile');
  groupsRouter = require('../../RunHerDatabase/routes/groups');
  groupRunsRouter = require('../../RunHerDatabase/routes/groupRuns');
} catch (error) {
  console.error('Error loading route modules:', error);
}

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS for production
const corsOptions = {
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  next();
});

// Use route handlers with correct path mounting (with safety checks)
if (authRouter) app.use('/auth', authRouter);
if (usersRouter) app.use('/users', usersRouter);
if (routesRouter) app.use('/routes', routesRouter);
if (runsRouter) app.use('/runs', runsRouter);
if (messagesRouter) app.use('/messages', messagesRouter);
if (socialRouter) app.use('/social', socialRouter);
if (resetRouter) app.use('/reset', resetRouter);
if (profileRouter) app.use('/profile', profileRouter);
if (groupsRouter) app.use('/groups', groupsRouter);
if (groupRunsRouter) app.use('/group-runs', groupRunsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodbConnected: mongoose.connection.readyState === 1,
    routes: [
      '/auth/login',
      '/auth/register',
      '/users',
      '/profile',
      '/social',
      '/runs',
      '/messages'
    ]
  });
});

// Test endpoint for debugging
app.get('/test', (req, res) => {
  res.json({
    message: 'API is working! Updated with auth routes.',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasMongodbUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      mongoConnection: mongoose.connection.readyState
    }
  });
});

// Handle 404s
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// MongoDB connection with better error handling
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    console.log('Connecting to MongoDB...');
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDb = connection;
    console.log('MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Netlify function handler
const handler = async (event, context) => {
  // Enable connection reuse
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Handle the request
    return await serverless(app)(event, context);
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

module.exports = { handler };
