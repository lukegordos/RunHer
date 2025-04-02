const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('\n--- Registration Attempt ---');
    console.log('Request body:', req.body);
    
    if (!req.body || !req.body.username || !req.body.email || !req.body.password) {
      console.log('Missing required fields:', req.body);
      return res.status(400).json({
        error: 'Missing required fields. Please provide username, email, and password.'
      });
    }

    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      console.log('User already exists:', { email, username });
      return res.status(400).json({ 
        error: 'Email or username already in use' 
      });
    }
    
    // Create new user
    console.log('Creating new user:', { username, email });
    const user = new User({ username, email, password });
    
    try {
      await user.save();
      console.log('User saved successfully');
      
      // Return success but don't include password
      const userObj = user.toObject();
      delete userObj.password;
      
      res.status(201).json({ 
        message: 'User registered successfully', 
        user: userObj 
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: Object.values(saveError.errors).map(err => err.message)
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      details: error.message 
    });
  }
});

// Login user
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Send token and user data
    const userObj = user.toObject();
    delete userObj.password;
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message 
    });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Check if username or email is already in use by another user
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.userData.userId } },
          { $or: [
            { username: username || null },
            { email: email || null }
          ]}
        ]
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already in use' });
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.userData.userId,
      { $set: { username, email } },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Profile update failed', 
      details: error.message 
    });
  }
});

module.exports = router;