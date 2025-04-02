const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const authenticate = require('../middleware/auth');

// Get all users (safe version - no sensitive data)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, { 
            username: 1, 
            email: 1, 
            createdAt: 1,
            _id: 1 
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users (excluding passwords)
router.get('/all', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DEBUG route - Get database info
router.get('/debug', async (req, res) => {
    try {
        const dbName = mongoose.connection.db.databaseName;
        const collections = await mongoose.connection.db.listCollections().toArray();
        const users = await User.find({});
        
        res.json({
            databaseName: dbName,
            collections: collections.map(c => c.name),
            userCount: users.length,
            users: users.map(u => ({
                id: u._id,
                username: u.username,
                email: u.email,
                createdAt: u.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
