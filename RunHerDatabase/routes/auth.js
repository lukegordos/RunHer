const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Temporary route to list users - REMOVE IN PRODUCTION
router.get('/list-users', async (req, res) => {
  try {
    const users = await User.find({}).select('name email');
    res.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    console.log('Attempting to save user to MongoDB...');
    await user.save();
    console.log('User saved successfully, MongoDB _id:', user._id);

    // Create token
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Sending success response with token and user');
    res.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration error details:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    console.log('Finding user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found with email:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('User found, checking password');
    // Check password
    console.log('Comparing passwords:', {
      provided: password,
      stored: user.password
    });
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      console.log('Login failed: Password does not match');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Password matched, creating token');
    // Create token
    const token = jwt.sign(
      { userId: user._id.toString(), name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login successful for user:', user._id);
    res.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        location: user.location,
        experienceLevel: user.experienceLevel,
        preferredTime: user.preferredTime,
        pace: user.pace
      }
    });
  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;