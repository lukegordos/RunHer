const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  try {
    console.log('Auth middleware:', {
      path: req.path,
      method: req.method,
      authorization: req.headers.authorization
    });

    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.warn('No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified:', { userId: decoded.userId });
    req.userData = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    return res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message
    });
  }
};

module.exports = authenticate;